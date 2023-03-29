use crate::error::Result;
use rusqlite::Connection;

const USER_MESSAGE_TABLE: &str = r#"
    CREATE TABLE IF NOT EXISTS user_message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        topic_id INTEGER NOT NULL,
        CONSTRAINT fk_topic 
        FOREIGN KEY (topic_id)
        REFERENCES topic (id)
    )
"#;
const USER_MESSAGE_INSERT: &str = r#"
    INSERT INTO user_message (message, created_at, topic_id)
    VALUES (?1, ?2, ?3);
"#;

pub struct UserMessage {
    id: u32,
    message: String,
    created_at: u64,
    topic_id: u32,
}

impl UserMessage {
    pub fn new(message: String, created_at: u64, topic_id: u32) -> Self {
        return UserMessage {
            id: 0,
            message,
            created_at,
            topic_id,
        };
    }

    pub fn insert(self, conn: &Connection) -> Result<usize> {
        conn.execute(
            USER_MESSAGE_INSERT,
            (self.message, self.created_at, self.topic_id),
        )
        .map_err(|e| e.to_string())
    }
}

pub fn user_message_exists(conn: &Connection, user_message_id: u32) -> Result<bool> {
    let query = "SELECT EXISTS(SELECT 1 FROM user_message WHERE id = ? LIMIT 1)";
    let exists = conn
        .query_row(query, [user_message_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(exists)
}

const CHATGPT_MESSAGE_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS chatgpt_message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        user_message_id INTEGER NOT NULL,
        CONSTRAINT fk_user_message
        FOREIGN KEY (user_message_id)
        REFERENCES user_message (id)
    )
    "#;

const CHATGPT_MESSAGE_INSERT: &str = r#"
    INSERT INTO chatgpt_message (message, created_at, user_message_id)
    VALUES (?1, ?2, ?3);
    "#;

pub struct ChatGPTMessage {
    id: u32,
    message: String,
    created_at: u64,
    user_message_id: u32,
}

impl ChatGPTMessage {
    pub fn new(message: String, created_at: u64, user_message_id: u32) -> Self {
        return ChatGPTMessage {
            id: 0,
            message,
            created_at,
            user_message_id,
        };
    }

    pub fn insert(self, conn: &Connection) -> Result<usize> {
        conn.execute(
            CHATGPT_MESSAGE_INSERT,
            (self.message, self.created_at, self.user_message_id),
        )
        .map_err(|e| e.to_string())
    }
}

pub fn chatgpt_message_exists(conn: &Connection, chatgpt_message_id: u32) -> Result<bool> {
    let query = "SELECT EXISTS(SELECT 1 FROM chatgpt_message WHERE id = ? LIMIT 1)";
    let exists = conn
        .query_row(query, [chatgpt_message_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(exists)
}

pub(crate) fn init_messages(conn: &Connection) -> Result<()> {
    conn.execute(USER_MESSAGE_TABLE, ())
        .map_err(|e| e.to_string())?;
    conn.execute(CHATGPT_MESSAGE_TABLE, ())
        .map_err(|e| e.to_string())?;

    Ok(())
}
