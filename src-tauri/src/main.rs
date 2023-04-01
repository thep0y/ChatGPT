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
use crate::error::Result;
use crate::logger::{log_level, logger_config};
use chat::chat::{chat_gpt_client, chat_gpt_steam_client, ChatGPTRequest, ChatGPTResponse};
use chat::models::{get_chat_models, ModelResponse};
use config::{Config, Proxy, APP_CONFIG_DIR};
use db::manager::SqliteConnectionManager;
use db::message::init_messages;
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
async fn read_config() -> Result<Config> {
    let config = match config::read_config()? {
        Some(config) => Ok(config),
        None => Ok(Config {
            proxy: Proxy {
                protocol: "socks5://".to_string(),
                host: "localhost".to_string(),
                port: 1080,
            },
            open_api_key: "".to_string(),
            image_scale: 4,
            use_context: false,
            use_stream: Some(true),
        }),
    };

    debug!("读取配置文件：{:?}", config);

    config
}

#[tauri::command]
async fn write_config(config: Config) -> Result<()> {
    config::write_config(&config)?;

    debug!("已保存配置 {:?}", config);

    Ok(())
}

#[tauri::command]
async fn chat_gpt(
    proxy: String,
    api_key: String,
    request: ChatGPTRequest,
) -> Result<ChatGPTResponse> {
    debug!("发送的消息：{:?}", request);
    chat_gpt_client(&proxy, &api_key, request).await
}

#[tauri::command]
async fn chat_gpt_stream(
    window: tauri::Window,
    proxy: String,
    api_key: String,
    request: ChatGPTRequest,
) -> Result<()> {
    debug!("发送的消息：{:?}", request);
    let response = chat_gpt_steam_client(&proxy, &api_key, request).await;
    let mut stream = response.bytes_stream();

    let mut message_parts = Vec::<String>::new();

    let abort_flag = Arc::new(AtomicBool::new(false));
    let abort_flag_clone = Arc::clone(&abort_flag);
    let id = window.listen("abort-stream", move |_| {
        abort_flag_clone.store(true, Ordering::Relaxed);
    });

    while let Some(item) = stream.next().await {
        let bytes = item.map_err(|e| e.to_string())?;
        let mut chunk = std::str::from_utf8(&bytes).map_err(|e| e.to_string())?;
        debug!("chunk: {}", chunk);

        chunk = chunk.trim();
        let slices: Vec<&str> = chunk.split("\n\n").collect();
        trace!("slices: {:?}", slices);

        for item in slices.iter() {
            let body = &item[6..];
            if body == "[DONE]" {
                window.emit("stream", "done").unwrap();
                break;
            }

            let chunk_message: MessageChunk =
                serde_json::from_str(body).map_err(|e| e.to_string())?;

            if let Some(part) = &chunk_message.clone().choices[0].delta.content {
                message_parts.push(part.to_string());
            }

            window.emit("stream", chunk_message).unwrap();
        }

        if abort_flag.load(Ordering::Relaxed) {
            break;
        }
    }
    trace!("chunk_messages: {:?}", message_parts);

    window.unlisten(id);
    Ok(())
}

#[tauri::command]
async fn get_topics(pool: tauri::State<'_, SQLitePool>) -> Result<Vec<Topic>> {
    let conn = pool.get().map_err(|e| e.to_string())?;
    let topics = get_all_topics(&conn).map_err(|e| e.to_string())?;

    debug!("获取到全部主题：{:?}", topics);

    Ok(topics)
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
            write_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
