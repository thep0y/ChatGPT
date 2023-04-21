use crate::{config::ProxyConfig, error::Result};
use reqwest::Client;

pub(crate) fn new_http_client_with_proxy(proxy: &str) -> Result<Client> {
    debug!("使用的代理：{}", proxy);

    let proxy = reqwest::Proxy::all(proxy).map_err(|e| e.to_string())?;
    let client = reqwest::Client::builder()
        .proxy(proxy)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(client)
}

pub(crate) fn new_http_client() -> Result<Client> {
    let client = reqwest::Client::new();

    Ok(client)
}

pub fn new_client(proxy_config: &ProxyConfig) -> Result<Client> {
    if proxy_config.method == "proxy" {
        new_http_client_with_proxy(&proxy_config.to_string())
    } else {
        new_http_client()
    }
}
