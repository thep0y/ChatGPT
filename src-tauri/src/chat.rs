use crate::error::Result;
use lazy_static::lazy_static;
use reqwest::{
    header::{HeaderMap, AUTHORIZATION},
    Client,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{collections::HashMap, env, process::exit};
use url::Url;

// ChatGPT API基础URL
const API_BASE_URL: &str = "https://api.openai.com";

lazy_static! {
    // ChatGPT API密钥
    static ref API_KEY: String = {
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
fn create_headers() -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        format!("Bearer {}", *API_KEY).parse().unwrap(),
    );

    debug!("headers: {:?}", headers);

    headers
}

fn new_http_client() -> Result<Client> {
    let proxy = reqwest::Proxy::all("socks5h://127.0.0.1:1086").map_err(|e| e.to_string())?;
    let client = reqwest::Client::builder()
        .proxy(proxy)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(client)
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
        debug!("查询参数：{:?}", query_params);
        Url::parse_with_params(API_BASE_URL, &query_params)
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
pub async fn chat_gpt_client(request: ChatGPTRequest) -> Result<ChatGPTResponse> {
    let client = new_http_client()?;
    let url = request.to_query_string();
    let response = client
        .get(&url)
        .headers(create_headers())
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<Value>()
        .await
        .map_err(|e| e.to_string())?;

    debug!("response {:?}", response);
    Ok(serde_json::from_value(response).map_err(|e| e.to_string())?)
}

#[derive(Debug, Deserialize, Serialize)]
struct Permission {
    id: String,
    object: String,
    created: u64,
    allow_create_engine: bool,
    allow_sampling: bool,
    allow_logprobs: bool,
    allow_search_indices: bool,
    allow_view: bool,
    allow_fine_tuning: bool,
    organization: String,
    group: Option<String>,
    is_blocking: bool,
}

#[derive(Debug, Deserialize, Serialize)]
struct Model {
    id: String,
    object: String,
    created: u64,
    owned_by: String,
    permission: Vec<Permission>,
    root: String,
    parent: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ModelResponse {
    object: String,
    data: Vec<Model>,
}

pub async fn get_chat_models() -> Result<ModelResponse> {
    let client = new_http_client()?;

    let url = format!("{}{}", API_BASE_URL, "/v1/models");
    let response = client
        .get(&url)
        .headers(create_headers())
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<Value>()
        .await
        .map_err(|e| e.to_string())?;

    debug!("response {:?}", response);
    Ok(serde_json::from_value(response).map_err(|e| e.to_string())?)
}
