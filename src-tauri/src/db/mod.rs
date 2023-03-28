pub mod conversation;
pub mod message;
pub mod topic;

use rusqlite::{Connection, Result};

use crate::config::APP_CONFIG_DIR;

use self::{conversation::init_conversation, message::init_messages, topic::init_topic};

/// 创建一个 sqlite 连接。
///
/// rusqlite Connection 无法在多线程间共享，只能每次使用时创建。
pub fn new_connection() -> Result<Connection> {
    Connection::open(APP_CONFIG_DIR.join("chat.db"))
}
