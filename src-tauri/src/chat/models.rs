use crate::{
    chat::{client::new_http_client, create_headers, API_BASE_URL},
    error::Result,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Deserialize, Serialize)]
pub struct Permission {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub allow_create_engine: bool,
    pub allow_sampling: bool,
    pub allow_logprobs: bool,
    pub allow_search_indices: bool,
    pub allow_view: bool,
    pub allow_fine_tuning: bool,
    pub organization: String,
    pub group: Option<String>,
    pub is_blocking: bool,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Model {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub owned_by: String,
    pub permission: Vec<Permission>,
    pub root: String,
    pub parent: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ModelResponse {
    pub object: String,
    pub data: Vec<Model>,
}

pub async fn get_chat_models(proxy: &str, api_key: &str) -> Result<ModelResponse> {
    let client = new_http_client(proxy)?;

    let url = format!("{}{}", API_BASE_URL, "/v1/models");
    let response = client
        .get(&url)
        .headers(create_headers(api_key))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<Value>()
        .await
        .map_err(|e| e.to_string())?;

    debug!("response {:?}", response);
    Ok(serde_json::from_value(response).map_err(|e| e.to_string())?)
}
