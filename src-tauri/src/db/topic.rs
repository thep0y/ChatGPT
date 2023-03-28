use super::new_connection;
use crate::error::Result;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

const TOPIC_TABLE: &str = r#"
    CREATE TABLE IF NOT EXISTS topic (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(20) NOT NULL,
        created_at INTEGER NOT NULL
    )
"#;

const TOPIC_INSERT: &str = r#"
    INSERT INTO topic (name, created_at) VALUES (?1, ?2)
"#;

#[derive(Debug, Deserialize, Serialize)]
pub struct Topic {
    id: u32,
    name: String,
    created_at: u64,
}

impl Topic {
    pub fn new(name: &str, created_at: &u64) -> Self {
        return Topic {
            id: 0,
            name: name.into(),
            created_at: *created_at,
        };
    }

    pub fn insert(self) -> Result<usize> {
        let conn = new_connection().unwrap();

        conn.execute(TOPIC_INSERT, (self.name, self.created_at))
            .map_err(|e| e.to_string())
    }
}

pub fn topic_exists(conn: &Connection, topic_id: u32) -> Result<bool> {
    let query = "SELECT EXISTS(SELECT 1 FROM topic WHERE topic_id = ? LIMIT 1)";
    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;
    let exists = stmt
        .query_row(params![topic_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(exists)
}

pub fn topic_exists_by_name(conn: &Connection, name: &str) -> Result<bool> {
    let query = "SELECT EXISTS(SELECT 1 FROM topic WHERE name = ? LIMIT 1)";
    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;
    let exists = stmt
        .query_row(params![name], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(exists)
}

pub(crate) fn init_topic() -> Result<()> {
    let conn = new_connection().map_err(|e| e.to_string())?;
    conn.execute(TOPIC_TABLE, ()).map_err(|e| e.to_string())?;

    let free_name = "自由对话";

    if topic_exists_by_name(&conn, free_name)? {
        debug!("自由对话主题已存在");
        return Ok(());
    }

    let free = Topic {
        id: 0,
        name: free_name.into(),
        created_at: OffsetDateTime::now_local()
            .map_err(|e| e.to_string())?
            .unix_timestamp() as u64,
    };
    conn.execute(TOPIC_INSERT, (free.name, free.created_at))
        .map_err(|e| e.to_string())?;

    Ok(())
}

const SELECT_ALL_TOPICS: &str = r#"
    SELECT id, name, created_at FROM topic
"#;

fn get_topics(conn: &Connection) -> Result<Vec<Topic>> {
    let mut stmt = conn.prepare(SELECT_ALL_TOPICS).map_err(|e| e.to_string())?;
    let topics_iter = stmt
        .query_map([], |row| {
            Ok(Topic {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut topics = Vec::<Topic>::new();
    for topic in topics_iter {
        topics.push(topic.map_err(|e| e.to_string())?);
    }

    Ok(topics)
}

/// 返回包含所有话题的 Result<Vec<Topic>>
///
/// # Params
///
/// - `conn`: 一个连接到 chat.db 的引用。
/// 如果没有传入 conn，则新建一个 conn。
///
/// # Returns
///
/// 包含所有话题的 Result<Vec<Topic>>
///
/// # Error
///
/// 返回 Rusqlite 的错误信息
pub fn get_all_topics<'a, T: Into<Option<&'a Connection>>>(conn: T) -> Result<Vec<Topic>> {
    match conn.into() {
        Some(conn) => get_topics(conn),
        None => {
            let conn = new_connection().map_err(|e| e.to_string())?;

            get_topics(&conn)
        }
    }
}
