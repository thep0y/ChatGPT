#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod chat;
mod config;
mod db;
mod error;
mod export;
mod logger;
mod time;

#[macro_use]
extern crate log;
extern crate simplelog;

use crate::chat::chat::MessageChunk;
use crate::db::message::{AssistantMessage, UserMessage};
use crate::db::topic::{insert_topic, update_topic_by_id};
use crate::error::Result;
use crate::logger::{log_level, logger_config};
use chat::chat::{
    chat_gpt_client, chat_gpt_steam_client, ChatGPTRequest, ChatGPTResponse, Message,
};
use chat::models::{get_chat_models, ModelResponse};
use config::{Config, ProxyConfig, APP_CONFIG_DIR};
use db::manager::SqliteConnectionManager;
use db::message::{get_messages, init_messages, Conversation};
use db::topic::{get_all_topics, init_topic, Topic};
use export::markdown::{format_user_message, UserMessageMode};
use futures_util::StreamExt;
use reqwest_eventsource::Event;
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
    let mut file = if offset == 0 {
        File::create(filepath).await.map_err(|e| e.to_string())?
    } else {
        OpenOptions::new()
            .append(true)
            .open(filepath)
            .await
            .map_err(|e| e.to_string())?
    };

    let mut writer = BufWriter::new(&mut file);
    writer.write_all(&buf).await.map_err(|e| e.to_string())?;
    writer.flush().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn export_to_markdown(
    mode: usize,
    filepath: String,
    topic_name: String,
    message: Message,
    offset: u32,
) -> Result<()> {
    let user_message_mode = UserMessageMode::try_from(mode)?;

    let text = if offset == 0 {
        format!(
            "# {}\n\n{}\n",
            topic_name,
            format_user_message(&message.content, user_message_mode)
        )
    } else if message.role == "user" {
        format!(
            "\n{}\n",
            format_user_message(&message.content, user_message_mode)
        )
    } else {
        message.content + "\n"
    };

    let mut file = if offset == 0 {
        File::create(filepath).await.map_err(|e| e.to_string())?
    } else {
        OpenOptions::new()
            .append(true)
            .open(filepath)
            .await
            .map_err(|e| e.to_string())?
    };

    let mut writer = BufWriter::new(&mut file);

    writer
        .write_all(text.as_bytes())
        .await
        .map_err(|e| e.to_string())?;
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
    pool: tauri::State<'_, SQLitePool>,
    proxy_config: ProxyConfig,
    api_key: String,
    topic_id: u32,
    request: ChatGPTRequest,
    created_at: u64,
) -> Result<ChatGPTResponse> {
    debug!("使用的代理：{:?}", proxy_config);
    debug!("发送的消息：{:?}", request);

    let messages_len = request.messages.len();

    let user_message_content = &request.messages[messages_len - 1].content.clone();

    let response = match chat_gpt_client(&proxy_config, &api_key, request).await {
        Ok(r) => r,
        Err(e) => {
            error!("获取普通响应时出错：{}", e);
            return Err(e.to_string());
        }
    };

    let user_message = UserMessage::new(user_message_content, created_at, topic_id);

    let conn = pool.get().map_err(|e| e.to_string())?;
    user_message.insert(&conn).map_err(|e| e.to_string())?;

    let user_message_id = conn.last_insert_rowid() as u32;

    let chat_message = AssistantMessage::new(
        response.choices[0].message.content.clone(),
        response.created,
        user_message_id,
    );

    chat_message.insert(&conn).map_err(|e| e.to_string())?;

    Ok(response)
}

#[tauri::command]
async fn chat_gpt_stream(
    pool: tauri::State<'_, SQLitePool>,
    window: tauri::Window,
    proxy_config: ProxyConfig,
    api_key: String,
    topic_id: u32,
    request: ChatGPTRequest,
    created_at: u64,
) -> Result<u32> {
    debug!("使用的代理：{:?}", proxy_config);
    debug!("发送的消息：{:?}", request);

    let messages_len = request.messages.len();

    let user_message_content = &request.messages[messages_len - 1].content.clone();

    let mut es = match chat_gpt_steam_client(&proxy_config, &api_key, request).await {
        Ok(r) => r,
        Err(e) => {
            error!("获取流式响应时出错：{}", e);
            return Err(e.to_string());
        }
    };

    // let mut stream = response.bytes_stream();

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

    // TODO: 超过一定时间(默认 5 秒)后未能继续获得 chunk 则自动中断，意味着响应失败
    while let Some(event) = es.next().await {
        match event {
            Ok(Event::Open) => trace!("Connection Open!"),
            Ok(Event::Message(message)) => {
                debug!("Message: {:#?}", message.data);

                let data = &message.data;

                if data == "[DONE]" {
                    window.emit("stream", "done").map_err(|e| e.to_string())?;
                    break;
                }

                let chunk_message: MessageChunk = match serde_json::from_str(data) {
                    Ok(r) => r,
                    Err(e) => {
                        error!("反序列化 chunk str 时出错：{}", e);
                        return Err(e.to_string());
                    }
                };

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
            Err(err) => {
                match err {
                    reqwest_eventsource::Error::StreamEnded => {
                        trace!("Connection Done!")
                    }
                    _ => {
                        error!("解析流式响应时出错：{}", err);
                        return Err(err.to_string());
                    }
                }
                es.close();
            }
        }

        if abort_flag.load(Ordering::Relaxed) {
            done_flag = false;
            es.close();
            break;
        }
    }

    let message = message_parts.join("");
    trace!("chunk message: {:?}", message);

    let mut user_message_id = 0u32;

    if done_flag {
        let user_message = UserMessage::new(user_message_content, created_at, topic_id);

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
    trace!("获取全部主题");

    let conn = match pool.get() {
        Ok(c) => c,
        Err(e) => {
            error!("从连接池中获取连接时出错：{}", e);
            return Err(e.to_string());
        }
    };

    let topics = match get_all_topics(&conn) {
        Ok(c) => c,
        Err(e) => {
            error!("获取全部主题时出错：{}", e);
            return Err(e.to_string());
        }
    };

    debug!("获取到全部主题：{:?}", topics);

    Ok(topics)
}

#[tauri::command]
async fn update_topic(
    pool: tauri::State<'_, SQLitePool>,
    topid_id: u32,
    new_name: String,
    new_description: String,
) -> Result<()> {
    trace!(
        "更新主题：id={}, name={}, new_description={}",
        topid_id,
        new_name,
        new_description
    );

    let conn = pool.get().map_err(|e| e.to_string())?;
    update_topic_by_id(&conn, topid_id, &new_name, &new_description).map_err(|e| e.to_string())?;

    debug!(
        "已更新主题名：id={}, name={}, description={}",
        topid_id, new_name, new_description
    );

    Ok(())
}

#[tauri::command]
async fn new_topic(
    pool: tauri::State<'_, SQLitePool>,
    name: String,
    description: String,
    created_at: u64,
) -> Result<i64> {
    trace!("插入新主题");

    let new_topic = match Topic::new(&name, &description, created_at) {
        Ok(t) => t,
        Err(e) => {
            error!("创建新主题时出错：{}", e);
            return Err(e.to_string());
        }
    };

    let conn = match pool.get() {
        Ok(c) => c,
        Err(e) => {
            error!("从连接池中获取连接时出错：{}", e);
            return Err(e.to_string());
        }
    };

    match insert_topic(&conn, &new_topic) {
        Ok(()) => (),
        Err(e) => {
            error!("插入新主题时出错：{}", e);
            return Err(e.to_string());
        }
    };

    debug!("已插入新主题到数据库：{:?}", name);

    Ok(conn.last_insert_rowid())
}

#[tauri::command]
async fn clear_topic(pool: tauri::State<'_, SQLitePool>, topic_id: u32) -> Result<()> {
    trace!("清空主题消息");

    let conn = match pool.get() {
        Ok(c) => c,
        Err(e) => {
            error!("从连接池中获取连接时出错：{}", e);
            return Err(e.to_string());
        }
    };

    let sql = format!(
        r#"
        BEGIN;
        DELETE FROM assistant_message WHERE user_message_id IN (
            SELECT id FROM user_message WHERE topic_id = {}
        );
        DELETE FROM user_message WHERE topic_id = {};
        COMMIT; 
        "#,
        topic_id, topic_id
    );

    match conn.execute_batch(&sql) {
        Ok(()) => {
            debug!("已清空主题消息：{}", topic_id);
            return Ok(());
        }
        Err(e) => {
            error!("清空主题时出错：{}", e);
            return Err(e.to_string());
        }
    }
}

#[tauri::command]
async fn delete_topic(pool: tauri::State<'_, SQLitePool>, topic_id: u32) -> Result<()> {
    trace!("删除主题");

    let conn = match pool.get() {
        Ok(c) => c,
        Err(e) => {
            error!("从连接池中获取连接时出错：{}", e);
            return Err(e.to_string());
        }
    };

    let sql = format!(
        r#"
        BEGIN;
        DELETE FROM assistant_message WHERE user_message_id IN (
            SELECT id FROM user_message WHERE topic_id = {}
        );
        DELETE FROM user_message WHERE topic_id = {};
        DELETE FROM topic WHERE id = {};
        COMMIT;
        "#,
        topic_id, topic_id, topic_id
    );

    match conn.execute_batch(&sql) {
        Ok(()) => {
            debug!("已删除主题：{}", topic_id);
            return Ok(());
        }
        Err(e) => {
            error!("删除主题时出错：{}", e);
            return Err(e.to_string());
        }
    }
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
            export_to_markdown,
            read_config,
            write_config,
            get_messages_by_topic_id,
            new_topic,
            update_topic,
            clear_topic,
            delete_topic
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
