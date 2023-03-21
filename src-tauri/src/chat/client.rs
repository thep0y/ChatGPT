use crate::error::Result;
use reqwest::Client;

pub(crate) fn new_http_client() -> Result<Client> {
    let proxy = reqwest::Proxy::all("socks5h://127.0.0.1:1086").map_err(|e| e.to_string())?;
    let client = reqwest::Client::builder()
        .proxy(proxy)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(client)
}
