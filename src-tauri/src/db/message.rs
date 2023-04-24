use anyhow::{Context, Ok, Result};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

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

const ASSISTANT_MESSAGE_TABLE: &str = r#"
    CREATE TABLE IF NOT EXISTS assistant_message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        user_message_id INTEGER NOT NULL,
        CONSTRAINT fk_user_message
        FOREIGN KEY (user_message_id)
        REFERENCES user_message (id)
    )
        "#;

const ASSISTANT_MESSAGE_INSERT: &str = r#"
        INSERT INTO assistant_message (message, created_at, user_message_id)
        VALUES (?1, ?2, ?3);
        "#;

const SELECT_ALL_MESSAGES: &str = r#"
    SELECT um.id, um.message, um.created_at, am.id, am.message, am.created_at, am.user_message_id
    FROM user_message um
    INNER JOIN assistant_message am ON um.id = am.user_message_id
    WHERE um.topic_id = ?;
"#;

#[derive(Debug, Deserialize, Serialize)]
pub struct UserMessage {
    id: u32,
    message: String,
    created_at: u64,
    topic_id: u32,
}

impl UserMessage {
    pub fn new(message: &str, created_at: u64, topic_id: u32) -> Self {
        return UserMessage {
            id: 0,
            message: message.into(),
            created_at,
            topic_id,
        };
    }

    pub fn insert(&self, conn: &Connection) -> Result<usize> {
        conn.execute(
            USER_MESSAGE_INSERT,
            (&self.message, &self.created_at, &self.topic_id),
        )
        .with_context(|| {
            format!(
                "插入 user_message 失败：topic_id={}, message={}",
                self.topic_id, self.message
            )
        })
    }
}

// pub fn user_message_exists(conn: &Connection, user_message_id: u32) -> Result<bool> {
//     let query = "SELECT EXISTS(SELECT 1 FROM user_message WHERE id = ? LIMIT 1)";
//     conn.query_row(query, [user_message_id], |row| row.get(0))
//         .with_context(|| format!("查询 user_message 失败：id={}", user_message_id))
// }

#[derive(Debug, Deserialize, Serialize)]
pub struct AssistantMessage {
    id: u32,
    message: String,
    created_at: u64,
    user_message_id: u32,
}

impl AssistantMessage {
    pub fn new(message: String, created_at: u64, user_message_id: u32) -> Self {
        return AssistantMessage {
            id: 0,
            message,
            created_at,
            user_message_id,
        };
    }

    pub fn insert(&self, conn: &Connection) -> Result<usize> {
        conn.execute(
            ASSISTANT_MESSAGE_INSERT,
            (&self.message, &self.created_at, &self.user_message_id),
        )
        .with_context(|| {
            format!(
                "插入 assistant_message 失败：user_message_id={}, message={}",
                self.user_message_id, self.message
            )
        })
    }
}

// pub fn assistant_message_exists(conn: &Connection, assistant_message_id: u32) -> Result<bool> {
//     let query = "SELECT EXISTS(SELECT 1 FROM assistant_message WHERE id = ? LIMIT 1)";
//     conn.query_row(query, [assistant_message_id], |row| row.get(0))
//         .with_context(|| format!("查询 assistant_message 失败：id={}", assistant_message_id))
// }

pub fn init_messages(conn: &Connection) -> Result<()> {
    conn.execute(USER_MESSAGE_TABLE, ())
        .with_context(|| format!("创建 user_message 表失败"))?;
    conn.execute(ASSISTANT_MESSAGE_TABLE, ())
        .with_context(|| format!("创建 assistant_message 表失败"))?;

    Ok(())
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Conversation {
    user: UserMessage,
    assistant: AssistantMessage,
}

pub fn get_messages(conn: &Connection, topic_id: u32) -> Result<Vec<Conversation>> {
    let mut stmt = conn
        .prepare(SELECT_ALL_MESSAGES)
        .with_context(|| format!("准备所有消息查询语句时出错"))?;

    let conversations = stmt
        .query_map([topic_id], |row| {
            std::result::Result::Ok(Conversation {
                user: UserMessage {
                    id: row.get(0)?,
                    message: row.get(1)?,
                    created_at: row.get(2)?,
                    topic_id,
                },
                assistant: AssistantMessage {
                    id: row.get(3)?,
                    message: row.get(4)?,
                    created_at: row.get(5)?,
                    user_message_id: row.get(6)?,
                },
            })
        })
        .with_context(|| format!("获取所有消息时出错"))?
        .collect::<Result<Vec<_>, _>>()
        .with_context(|| format!("收集所有消息时出错"))?;

    Ok(conversations)
}

pub fn delete_user_message_by_time(conn: &Connection, create_at: u64) -> Result<()> {
    let sql = format!(
        r#"
        BEGIN;
        DELETE FROM assistant_message WHERE user_message_id = (
            SELECT id FROM user_message WHERE created_at = {}
        );
        DELETE FROM user_message WHERE created_at = {};
        COMMIT;
        "#,
        create_at, create_at
    );

    conn.execute_batch(&sql)
        .with_context(|| format!("删除用户消息时出错"))
}

// pub fn delete_user_message_by_id(conn: &Connection, id: u32) -> Result<()> {
//     let sql = format!(
//         r#"
//         BEGIN;
//         DELETE FROM assistant_message WHERE user_message_id = {}
//         );
//         DELETE FROM user_message WHERE id = {};
//         COMMIT;
//         "#,
//         id, id
//     );

//     conn.execute_batch(&sql)
//         .with_context(|| format!("删除用户消息时出错"))
// }
