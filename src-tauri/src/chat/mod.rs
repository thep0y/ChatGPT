use lazy_static::lazy_static;
use reqwest::header::{HeaderMap, AUTHORIZATION};
use std::{env, process::exit};

pub mod chat;
pub mod client;
pub mod models;

// ChatGPT API基础URL
const API_BASE_URL: &str = "https://api.openai.com";

lazy_static! {
    // ChatGPT API密钥
    pub(crate) static ref API_KEY: String = {
        match env::var("OPEN_API_KEY") {
            Ok(v) => {
                debug!("token in env: {}", v);
                v
            },
            Err(e) => {
                error!("从环境变量中获取 OPEN_API_KEY 时出错: {}", e);
                exit(1);
            }
        }
    };
}

// ChatGPT API请求头
pub(crate) fn create_headers() -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        format!("Bearer {}", *API_KEY).parse().unwrap(),
    );

    debug!("headers: {:?}", headers);

    headers
}
