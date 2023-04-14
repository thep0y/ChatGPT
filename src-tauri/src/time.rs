use anyhow::{Context, Result};
use time::OffsetDateTime;

pub fn now() -> Result<u64> {
    let odt = OffsetDateTime::now_local().with_context(|| format!("创建主题时出错"))?;

    Ok(odt.unix_timestamp() as u64)
}
