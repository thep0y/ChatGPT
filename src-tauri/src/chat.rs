use crate::error::Result;
use reqwest::header::{HeaderMap, AUTHORIZATION};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use url::Url;

// ChatGPT API基础URL
const API_BASE_URL: &str = "https://api.chatgpt.com";

// ChatGPT API密钥
const API_KEY: &str = "YOUR_API_KEY";

// ChatGPT API请求头
fn create_headers() -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        format!("Bearer {}", API_KEY).parse().unwrap(),
    );
    headers
}

// ChatGPT API请求参数
#[derive(Debug, Deserialize, Serialize)]
pub struct ChatGPTRequest {
    pub text: String,
    pub model: String,
    pub prompt: Option<String>,
    pub length: Option<usize>,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub frequency_penalty: Option<f32>,
    pub presence_penalty: Option<f32>,
}

impl ChatGPTRequest {
    fn to_query_string(&self) -> String {
        let mut query_params: HashMap<&str, String> = HashMap::new();
        query_params.insert("text", self.text.clone());
        query_params.insert("model", self.model.clone());
        if let Some(prompt) = &self.prompt {
            query_params.insert("prompt", prompt.clone());
        }
        if let Some(length) = self.length {
            query_params.insert("length", length.to_string());
        }
        if let Some(temperature) = self.temperature {
            query_params.insert("temperature", temperature.to_string());
        }
        if let Some(top_p) = self.top_p {
            query_params.insert("top_p", top_p.to_string());
        }
        if let Some(frequency_penalty) = self.frequency_penalty {
            query_params.insert("frequency_penalty", frequency_penalty.to_string());
        }
        if let Some(presence_penalty) = self.presence_penalty {
            query_params.insert("presence_penalty", presence_penalty.to_string());
        }
        Url::parse_with_params("/", &query_params)
            .unwrap()
            .to_string()
    }
}

// ChatGPT API响应
#[derive(Debug, Deserialize, Serialize)]
pub struct ChatGPTResponse {
    pub text: String,
}

// ChatGPT API客户端
async fn chat_gpt_client(request: ChatGPTRequest) -> Result<ChatGPTResponse> {
    let client = reqwest::Client::new();
    let url = format!("{}{}", API_BASE_URL, request.to_query_string());
    let response = client
        .get(&url)
        .headers(create_headers())
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<Value>()
        .await
        .map_err(|e| e.to_string())?;
    Ok(serde_json::from_value(response).map_err(|e| e.to_string())?)
}
