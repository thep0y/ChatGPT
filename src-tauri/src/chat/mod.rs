use reqwest::header::{HeaderMap, AUTHORIZATION};

pub mod chat;
pub mod client;
pub mod models;

// ChatGPT API基础URL
const API_BASE_URL: &str = "https://api.openai.com";

// ChatGPT API请求头
pub(crate) fn create_headers(api_key: &str) -> HeaderMap {
    debug!("使用的 api key：{}", api_key);

    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        format!("Bearer {}", api_key).parse().unwrap(),
    );

    trace!("headers: {:?}", headers);

    headers
}
