use crate::{api::API_BASE_URL, config::ProxyConfig};

pub fn base_url(proxy_config: &ProxyConfig) -> String {
    if proxy_config.method == "proxy" {
        API_BASE_URL.to_owned()
    } else {
        proxy_config.to_string()
    }
}

pub fn api_url(proxy_config: &ProxyConfig, api: &str) -> String {
    format!("{}{}", base_url(proxy_config), api)
}
