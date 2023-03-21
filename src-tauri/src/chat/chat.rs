use crate::{
    chat::{client::new_http_client, create_headers, API_BASE_URL},
    error::Result,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Deserialize, Serialize)]
pub struct Message {
    role: String,
    content: String,
}

impl Message {
    pub fn new(role: String, content: String) -> Self {
        Message { role, content }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChatGPTRequest {
    pub model: String,
    pub messages: Vec<Message>,
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
    pub created: u64,
    pub choices: Vec<Choice>,
    pub usage: Usage,
}

const API: &str = "/v1/chat/completions";

// ChatGPT API客户端
pub async fn chat_gpt_client(request: ChatGPTRequest) -> Result<ChatGPTResponse> {
    let client = new_http_client()?;

    let url = format!("{}{}", API_BASE_URL, API);

    let mut headers = create_headers();
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
