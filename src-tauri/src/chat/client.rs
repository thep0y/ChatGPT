use crate::error::Result;
use reqwest::Client;

pub(crate) fn new_http_client(proxy: &str) -> Result<Client> {
    debug!("使用的代理：{}", proxy);

    let proxy = reqwest::Proxy::all(proxy).map_err(|e| e.to_string())?;
    let client = reqwest::Client::builder()
        .proxy(proxy)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(client)
}
