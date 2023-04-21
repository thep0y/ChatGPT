use std::time::Duration;

use crate::{
    api::{client::new_client, create_headers, url::api_url},
    config::ProxyConfig,
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
pub struct ModelsResponse {
    pub object: String,
    pub data: Vec<Model>,
}

const API: &str = "/v1/models";

pub async fn get_chat_models(proxy_config: &ProxyConfig, api_key: &str) -> Result<ModelsResponse> {
    let client = new_client(proxy_config)?;

    let url = api_url(proxy_config, API);

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

#[derive(Debug, Deserialize, Serialize)]
pub struct ModelResponse {
    pub id: String,
    pub object: String,
    pub owned_by: Vec<Model>,
}

pub async fn retrieve_model(
    proxy_config: &ProxyConfig,
    api_key: &str,
    model: &str,
) -> Result<Model> {
    let client = new_client(proxy_config)?;

    let url = api_url(proxy_config, API) + "/" + model;

    let response = client
        .get(&url)
        .headers(create_headers(api_key))
        .timeout(Duration::from_secs(5)) // TODO: 超时时间写到配置文件中
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<Value>()
        .await
        .map_err(|e| e.to_string())?;

    debug!("response {:?}", response);
    Ok(serde_json::from_value(response).map_err(|e| e.to_string())?)
}
