use anyhow::{Context, Ok, Result};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

use crate::time::now;

const TOPIC_TABLE: &str = r#"
    CREATE TABLE IF NOT EXISTS topic (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(20) NOT NULL,
        description VARCHAR(200) NOT NULL DEFAULT '',
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
    pub description: String,
    pub created_at: u64,
}

impl Topic {
    pub fn new(name: &str, description: &str, mut created_at: u64) -> Result<Self> {
        Self::new_with_id(0, name, description, created_at)
    }

    pub fn new_with_id(
        id: u32,
        name: &str,
        description: &str,
        mut created_at: u64,
    ) -> Result<Self> {
        if created_at == 0 {
            created_at = now()?;
        }

        Ok(Topic {
            id,
            name: name.to_string(),
            description: description.to_string(),
            created_at,
        })
    }

    pub fn insert(&self, conn: &Connection) -> Result<usize> {
        let count = conn
            .execute(TOPIC_INSERT, (&self.name, self.created_at))
            .with_context(|| format!("插入主题时出错：name={}", self.name))?;

        Ok(count)
    }
}

pub fn topic_exists(conn: &Connection, topic_id: u32) -> Result<bool> {
    let query = "SELECT EXISTS(SELECT 1 FROM topic WHERE id = ? LIMIT 1)";
    let exists = conn
        .query_row(query, params![topic_id], |row| row.get(0))
        .with_context(|| format!("查询主题时出错：id={}", topic_id))?;
    Ok(exists)
}

pub fn topic_exists_by_name(conn: &Connection, name: &str) -> Result<bool> {
    let query = "SELECT EXISTS(SELECT 1 FROM topic WHERE name = ? LIMIT 1)";
    let exists = conn
        .query_row(query, params![name], |row| row.get(0))
        .with_context(|| format!("查询主题时出错：name={}", name))?;
    Ok(exists)
}

const FREE_TOPIC_NAME: &str = "自由对话";
const FREE_TOPIC_DESCRIPTION: &str =
    "不使用上下文的简单问答，可在此主题中提问一些常识或答案偏固定的问题。";

const PROMPT_TOPIC_NAME: &str = "问题完善";
const PROMPT_TOPIC_DESCRIPTION: &str =
    "当你的问题比较笼统、不精确，已经或可能使 ChatGPT 无法正确理解时，可以通过此主题对你的问题进行完善。需要注意的是，当你完善一个问题后，在完善下一个问题前，应清空历史记录，否则生成的问题可能存在逻辑错误。";

pub fn init_topic(conn: &Connection) -> Result<()> {
    conn.execute(TOPIC_TABLE, ())
        .with_context(|| format!("创建主题表时出错"))?;

    let topics: [Topic; 2] = [
        Topic::new_with_id(1, FREE_TOPIC_NAME, FREE_TOPIC_DESCRIPTION, 0)?,
        Topic::new_with_id(2, PROMPT_TOPIC_NAME, PROMPT_TOPIC_DESCRIPTION, 0)?,
    ];

    for topic in topics.iter() {
        insert_topic(conn, topic)?;
    }

    Ok(())
}

pub fn insert_topic(conn: &Connection, topic: &Topic) -> Result<()> {
    if topic.id > 0 {
        if topic_exists(conn, topic.id)? {
            debug!("主题已存在：id={}", topic.id);
            return Ok(());
        }
    } else {
        if topic_exists_by_name(conn, &topic.name)? {
            debug!("主题 {} 已存在", topic.name);
            return Ok(());
        }
    }

    topic.insert(conn)?;

    Ok(())
}

const SELECT_ALL_TOPICS: &str = r#"
    SELECT id, name, description, created_at FROM topic
"#;

pub fn get_all_topics(conn: &Connection) -> Result<Vec<Topic>> {
    let mut stmt = conn.prepare(SELECT_ALL_TOPICS)?;
    let topics = stmt
        .query_map([], |row| {
            std::result::Result::Ok(Topic {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(topics)
}

pub fn update_topic_by_id(
    conn: &Connection,
    topid_id: u32,
    new_name: &str,
    new_description: &str,
) -> Result<usize> {
    let size = conn.execute(
        "UPDATE topic SET name = ?1 AND description = ?2 WHERE id = ?3",
        (new_name, new_description, topid_id),
    )?;

    Ok(size)
}
