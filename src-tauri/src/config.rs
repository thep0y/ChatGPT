use crate::error::Result;
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, path::PathBuf};

lazy_static! {
    pub static ref APP_CONFIG_DIR: PathBuf = {
        let config_dir = dirs::config_dir().unwrap();

        // 配置目录名符合不同系统的命名风格
        #[cfg(target_os = "windows")]
        let app_config_dir = config_dir.join("ChatgptClient");
        #[cfg(not(target_os = "windows"))]
        let app_config_dir = config_dir.join("chatgpt-client");

        if !app_config_dir.exists() {
            fs::create_dir(&app_config_dir).unwrap();
        }

        app_config_dir
    };
    static ref CONFIG_FILE: PathBuf = APP_CONFIG_DIR.join("config.toml");
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Proxy {
    pub protocol: String,
    pub host: String,
    pub port: u16,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ProxyConfig {
    pub method: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proxy: Option<Proxy>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reverse_proxy: Option<String>,
}

impl ProxyConfig {
    pub fn to_string(&self) -> String {
        if self.method == "proxy" {
            let proxy = self.proxy.as_ref().unwrap();
            return format!("{}{}:{}", proxy.protocol, proxy.host, proxy.port);
        }

        self.reverse_proxy.clone().unwrap()
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct PromptConfig {
    pub in_chinese: Option<bool>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct MarkdownConfig {
    mode: usize,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ExportConfig {
    markdown: MarkdownConfig,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Config {
    pub proxy: ProxyConfig,
    pub prompt: Option<PromptConfig>,
    pub export: Option<ExportConfig>,
    pub open_api_key: String,
    pub image_scale: u8,
    pub use_stream: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub topics: Option<HashMap<String, TopicConfig>>,
}

pub fn read_config() -> Result<Option<Config>> {
    if !CONFIG_FILE.exists() {
        return Ok(None);
    }

    let config_str = fs::read_to_string(CONFIG_FILE.to_owned()).map_err(|e| {
        error!("读取配置文件时出错：{}", e);
        e.to_string()
    })?;

    toml::from_str(&config_str).map_err(|e| {
        error!("解析配置文件时出错：{}", e);
        e.to_string()
    })
}

pub fn write_config(config: &Config) -> Result<()> {
    let config_str = toml::to_string(config).map_err(|e| e.to_string())?;

    fs::write(CONFIG_FILE.to_owned(), config_str).map_err(|e| e.to_string())
}

#[derive(Deserialize, Serialize, Debug)]
pub struct TopicConfig {
    pub use_context: bool,
    pub conversation_count: u8,
    pub use_first_conversation: bool,
    pub system_role: String,
}
