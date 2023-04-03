#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod chat;
mod config;
mod db;
mod error;
mod logger;

#[macro_use]
extern crate log;
extern crate simplelog;

use crate::chat::chat::MessageChunk;
use crate::db::message::{AssistantMessage, UserMessage};
use crate::db::topic::topic_exists_by_name;
use crate::error::Result;
use crate::logger::{log_level, logger_config};
use chat::chat::{chat_gpt_client, chat_gpt_steam_client, ChatGPTRequest, ChatGPTResponse};
use chat::models::{get_chat_models, ModelResponse};
use config::{Config, Proxy, ProxyConfig, APP_CONFIG_DIR};
use db::manager::SqliteConnectionManager;
use db::message::{get_messages, init_messages, Conversation};
use db::topic::{get_all_topics, init_topic, Topic};
use futures_util::StreamExt;
use simplelog::{ColorChoice, CombinedLogger, TermLogger, TerminalMode, WriteLogger};
use std::fs as SysFS;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tokio::fs::{File, OpenOptions};
use tokio::io::{AsyncWriteExt, BufWriter};
// use tauri::Manager;
// use window_shadows::set_shadow;

type SQLitePool = r2d2::Pool<SqliteConnectionManager>;

#[cfg(target_os = "linux")]
fn set_gtk_scale_env() {
    let sesstion_type = match std::env::var("XDG_SESSION_TYPE") {
        Ok(e) => e,
        Err(_) => "X11".to_string(),
    };

    if sesstion_type.to_uppercase() == "X11" {
        std::env::set_var("GDK_SCALE", "2");
        std::env::set_var("GDK_DPI_SCALE", "0.5");
    }
}

#[tauri::command]
async fn export_to_file(filepath: String, buf: Vec<u8>, offset: u32) -> Result<()> {
    if offset == 0 {
        let mut file = File::create(filepath).await.map_err(|e| e.to_string())?;
        return file.write_all(&buf).await.map_err(|e| e.to_string());
    }

    let file = OpenOptions::new()
        .append(true)
        .open(filepath)
        .await
        .map_err(|e| e.to_string())?;
    let mut writer = BufWriter::new(file);
    writer.write_all(&buf).await.map_err(|e| e.to_string())?;
    writer.flush().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_models(proxy: String, api_key: String) -> Result<ModelResponse> {
    get_chat_models(&proxy, &api_key).await
}

#[tauri::command]
async fn read_config() -> Result<Option<Config>> {
    let config = config::read_config()?;

    debug!("读取配置文件：{:?}", config);

    Ok(config)
}

#[tauri::command]
async fn write_config(config: Config) -> Result<()> {
    config::write_config(&config)?;

    debug!("已保存配置 {:?}", config);

    Ok(())
}

#[tauri::command]
async fn chat_gpt(
    proxy_config: ProxyConfig,
    api_key: String,
    request: ChatGPTRequest,
    created_at: u64,
) -> Result<ChatGPTResponse> {
    debug!("发送的消息：{:?}", request);
    chat_gpt_client(&proxy_config, &api_key, request).await
}

#[tauri::command]
async fn chat_gpt_stream(
    pool: tauri::State<'_, SQLitePool>,
    window: tauri::Window,
    proxy_config: ProxyConfig,
    api_key: &str,
    request: ChatGPTRequest,
    created_at: u64,
) -> Result<u32> {
    debug!("使用的代理：{:?}", proxy_config);
    debug!("发送的消息：{:?}", request);

    let user_message_content = &request.messages[0].content.clone();

    let response = chat_gpt_steam_client(&proxy_config, api_key, request).await?;
    let mut stream = response.bytes_stream();

    let mut message_parts = Vec::new();

    let abort_flag = Arc::new(AtomicBool::new(false));
    let id = window.listen("abort-stream", {
        let abort_flag = Arc::clone(&abort_flag);
        move |_| {
            info!("中断流式消息");
            abort_flag.store(true, Ordering::Relaxed);
        }
    });

    let mut done_flag = true;
    let mut response_time = 0u64;

    while let Some(item) = stream.next().await {
        let bytes = item.map_err(|e| e.to_string())?;
        let mut chunk = std::str::from_utf8(&bytes).map_err(|e| e.to_string())?;

        debug!("chunk: {}", chunk);

        chunk = chunk.trim();
        let slices = chunk.split("\n\n");

        for item in slices {
            let body = &item[6..];
            if body == "[DONE]" {
                window.emit("stream", "done").map_err(|e| e.to_string())?;
                break;
            }

            let chunk_message: MessageChunk =
                serde_json::from_str(body).map_err(|e| e.to_string())?;

            if response_time == 0 {
                response_time = chunk_message.created;
            }

            if let Some(part) = &chunk_message.choices[0].delta.content {
                message_parts.push(part.to_string());
            }

            window
                .emit("stream", chunk_message)
                .map_err(|e| e.to_string())?;
        }

        if abort_flag.load(Ordering::Relaxed) {
            done_flag = false;
            break;
        }
    }

    let message = message_parts.join("");
    trace!("chunk message: {:?}", message);

    let mut user_message_id = 0u32;

    if done_flag {
        let user_message = UserMessage::new(user_message_content, created_at, 1);

        let conn = pool.get().map_err(|e| e.to_string())?;
        user_message.insert(&conn).map_err(|e| e.to_string())?;

        user_message_id = conn.last_insert_rowid() as u32;

        let chat_message = AssistantMessage::new(message, response_time, user_message_id);

        chat_message.insert(&conn).map_err(|e| e.to_string())?;
    }

    window.unlisten(id);
    Ok(user_message_id)
}

#[tauri::command]
fn get_messages_by_topic_id(
    pool: tauri::State<'_, SQLitePool>,
    topic_id: u32,
) -> Result<Vec<Conversation>> {
    let conn = pool.get().map_err(|e| e.to_string())?;
    get_messages(&conn, topic_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_topics(pool: tauri::State<'_, SQLitePool>) -> Result<Vec<Topic>> {
    let conn = pool.get().map_err(|e| e.to_string())?;
    let topics = get_all_topics(&conn).map_err(|e| e.to_string())?;

    debug!("获取到全部主题：{:?}", topics);

    Ok(topics)
}

#[tauri::command]
async fn new_topic(
    pool: tauri::State<'_, SQLitePool>,
    name: String,
    created_at: u64,
) -> Result<()> {
    let new_topic = Topic::new(&name, created_at);

    let conn = pool.get().map_err(|e| e.to_string())?;

    if topic_exists_by_name(&conn, &name).map_err(|e| e.to_string())? {
        return Err(format!("主题 {} 已存在，不可重复创建", name));
    };

    new_topic.insert(&conn).map_err(|e| e.to_string())?;

    debug!("创建新主题：{:?}", name);

    Ok(())
}

fn init_database(pool: &SQLitePool) -> anyhow::Result<()> {
    let conn = pool.get()?;

    init_topic(&conn)?;
    init_messages(&conn)?;

    Ok(())
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    #[cfg(target_os = "linux")]
    set_gtk_scale_env();

    // trace 应该记录每一步代码的输出，用来追溯程序的运行情况。
    // debug 和 trace 没有本质上的区别，如果用来区分，则 debug 可以用来记录一些不重要的变量的日志。
    CombinedLogger::init(vec![
        TermLogger::new(
            log_level(),
            logger_config(true),
            TerminalMode::Mixed,
            ColorChoice::Auto,
        ),
        WriteLogger::new(
            log_level(),
            logger_config(true),
            SysFS::File::create(APP_CONFIG_DIR.join("chatgpt-client.log")).unwrap(),
        ),
    ])
    .unwrap();

    let manager = SqliteConnectionManager::file(APP_CONFIG_DIR.join("chat.db"));
    let pool: SQLitePool = r2d2::Pool::new(manager).unwrap();

    init_database(&pool)?;

    tauri::Builder::default()
        // .setup(|app| {
        //     // let window = app.get_window("main").unwrap();
        //     Ok(())
        // })
        .manage(pool)
        .invoke_handler(tauri::generate_handler![
            chat_gpt,
            chat_gpt_stream,
            get_topics,
            get_models,
            export_to_file,
            read_config,
            write_config,
            get_messages_by_topic_id,
            new_topic
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
