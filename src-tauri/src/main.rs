#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod chat;
mod error;
mod logger;

#[macro_use]
extern crate log;
extern crate simplelog;

use std::fs as SysFS;
use tokio::fs::{File, OpenOptions};
use tokio::io::{AsyncWriteExt, BufWriter};

use crate::error::Result;
use crate::logger::{log_level, logger_config};
use chat::chat::{chat_gpt_client, ChatGPTRequest, ChatGPTResponse, Message};
use chat::models::{get_chat_models, ModelResponse};
use simplelog::{ColorChoice, CombinedLogger, TermLogger, TerminalMode, WriteLogger};

// use tauri::Manager;
// use window_shadows::set_shadow;

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
async fn get_models() -> Result<ModelResponse> {
    get_chat_models().await
}

#[tauri::command]
async fn chat_gpt(text: String, model: String) -> Result<ChatGPTResponse> {
    chat_gpt_client(ChatGPTRequest {
        model: "gpt-3.5-turbo".to_string(),
        messages: vec![Message::new("user".to_string(), text)],
    })
    .await
}

#[tokio::main]
async fn main() {
    #[cfg(target_os = "linux")]
    set_gtk_scale_env();

    let config_dir = dirs::config_dir().unwrap();

    // 配置目录名符合不同系统的命名风格
    #[cfg(target_os = "windows")]
    let app_config_dir = config_dir.join("ChatgptClient");
    #[cfg(not(target_os = "windows"))]
    let app_config_dir = config_dir.join("chatgpt-client");

    if !app_config_dir.exists() {
        SysFS::create_dir(&app_config_dir).unwrap();
    }

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
            SysFS::File::create(app_config_dir.join("chatgpt-client.log")).unwrap(),
        ),
    ])
    .unwrap();

    tauri::Builder::default()
        // .setup(|app| {
        //     // let window = app.get_window("main").unwrap();
        //     Ok(())
        // })
        .invoke_handler(tauri::generate_handler![
            chat_gpt,
            get_models,
            export_to_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
