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
    pub id: u32,
    pub name: String,
    pub created_at: u64,
}

impl Topic {
    pub fn new(name: &str, created_at: u64) -> Self {
        Topic {
            id: 0,
            name: name.to_string(),
            created_at,
        }
    }

    fn insert(&self, conn: &Connection) -> Result<usize> {
        conn.execute(TOPIC_INSERT, (&self.name, self.created_at))
            .map_err(|e| e.to_string())
    }
}

pub fn topic_exists(conn: &Connection, topic_id: u32) -> Result<bool> {
    let query = "SELECT EXISTS(SELECT 1 FROM topic WHERE id = ? LIMIT 1)";
    let exists = conn
        .query_row(query, params![topic_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(exists)
}

pub fn topic_exists_by_name(conn: &Connection, name: &str) -> Result<bool> {
    let query = "SELECT EXISTS(SELECT 1 FROM topic WHERE name = ? LIMIT 1)";
    let exists = conn
        .query_row(query, params![name], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(exists)
}

const FREE_TOPIC_NAME: &str = "自由对话";

pub(crate) fn init_topic(conn: &Connection) -> Result<()> {
    conn.execute(TOPIC_TABLE, ()).map_err(|e| e.to_string())?;

    if topic_exists_by_name(&conn, FREE_TOPIC_NAME)? {
        debug!("自由对话主题已存在");
        return Ok(());
    }

    let free = Topic {
        id: 0,
        name: FREE_TOPIC_NAME.to_string(),
        created_at: OffsetDateTime::now_local()
            .map_err(|e| e.to_string())?
            .unix_timestamp() as u64,
    };

    free.insert(conn)?;

    Ok(())
}

const SELECT_ALL_TOPICS: &str = r#"
    SELECT id, name, created_at FROM topic
"#;

pub fn get_all_topics(conn: &Connection) -> Result<Vec<Topic>> {
    let mut stmt = conn.prepare(SELECT_ALL_TOPICS).map_err(|e| e.to_string())?;
    let topics = stmt
        .query_map([], |row| {
            Ok(Topic {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(topics)
}
