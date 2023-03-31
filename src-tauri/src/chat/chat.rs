use crate::{
    chat::{client::new_http_client, create_headers, API_BASE_URL},
    error::Result,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Deserialize, Serialize)]
pub struct Message {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Stop {
    String(String),
    Array(Vec<String>),
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChatGPTRequest {
    pub model: String,
    pub messages: Vec<Message>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>, // (0, 2), default: 1
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>, // (0, 1), default: 1
    #[serde(skip_serializing_if = "Option::is_none")]
    pub n: Option<u8>, // default: 1
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>, // default: false,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stop: Option<Stop>, // default: null
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u64>, // default: 无穷大
    #[serde(skip_serializing_if = "Option::is_none")]
    pub presence_penalty: Option<f32>, // (-2.0, 2.0), default: 0
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frequency_penalty: Option<f32>, // (-2.0, 2.0), default: 0
    // pub logit_bias: Option<HashMap<>> // TODO: 待处理
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Choice {
    pub index: u32,
    pub message: Message,
    pub finish_reason: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Usage {
    pub prompt_tokens: u16,
    pub completion_tokens: u16,
    pub total_tokens: u16,
}

// ChatGPT API响应
#[derive(Debug, Deserialize, Serialize)]
pub struct ChatGPTResponse {
    pub id: String,
    pub object: String,
    pub model: String,
    pub created: u64,
    pub choices: Vec<Choice>,
    pub usage: Usage,
}

const API: &str = "/v1/chat/completions";

// ChatGPT API客户端
pub async fn chat_gpt_client(
    proxy: &str,
    api_key: &str,
    request: ChatGPTRequest,
) -> Result<ChatGPTResponse> {
    let client = new_http_client(proxy)?;

    let url = format!("{}{}", API_BASE_URL, API);

    let mut headers = create_headers(api_key);
    headers.append("Content-Type", "application/json".parse().unwrap());

    let response = client
        .post(&url)
        .headers(headers)
        .json(&request)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<Value>()
        .await
        .map_err(|e| e.to_string())?;

    debug!("response {:?}", response);
    Ok(serde_json::from_value(response).map_err(|e| e.to_string())?)
}

// ChatGPT API客户端
pub async fn chat_gpt_steam_client(
    proxy: &str,
    api_key: &str,
    request: ChatGPTRequest,
) -> reqwest::Response {
    let client = new_http_client(proxy).unwrap();

    let url = format!("{}{}", API_BASE_URL, API);

    let mut headers = create_headers(api_key);
    headers.append("Content-Type", "application/json".parse().unwrap());

    client
        .post(&url)
        .headers(headers)
        .json(&request)
        .send()
        .await
        .unwrap()
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MessageChunkChoiceDelta {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MessageChunkChoice {
    pub delta: MessageChunkChoiceDelta,
    pub index: u8,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MessageChunk {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub model: String,
    pub choices: Vec<MessageChunkChoice>,
}
