use anyhow::Result;
use time::OffsetDateTime;

pub fn now() -> Result<u64> {
    let odt = match OffsetDateTime::now_local() {
        Ok(t) => t,
        Err(e) => {
            error!("获取本地时区失败：{}", e);
            OffsetDateTime::now_utc()
        }
    };

    Ok(odt.unix_timestamp() as u64)
}
