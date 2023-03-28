use time::OffsetDateTime;

use super::new_connection;

const CONVERSATION_TABLE: &str = r#"
    CREATE TABLE IF NOT EXISTS conversation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at INTEGER NOT NULL,
        topic_id INTEGER NOT NULL,
        CONSTRAINT fk_topic 
        FOREIGN KEY (topic_id)
        REFERENCES topic (id)
    )
"#;

const CONVERSATION_INSERT: &str = r#"
    INSERT INTO conversation (created_at, topic_id) VALUES (?1, ?2)
"#;

pub struct Conversation {
    id: u32,
    created_at: u64,
    topic_id: u32,
}

impl Conversation {
    pub fn new(created_at: &u64, topic_id: &u32) -> Self {
        return Conversation {
            id: 0,
            created_at: *created_at,
            topic_id: *topic_id,
        };
    }

    pub fn insert(self) {
        let conn = new_connection().unwrap();

        conn.execute(CONVERSATION_INSERT, (self.created_at, self.topic_id))
            .unwrap();
    }
}

pub(crate) fn init_conversation() {
    let conn = new_connection().unwrap();
    conn.execute(CONVERSATION_TABLE, ()).unwrap();

    let free = Conversation {
        id: 0,
        topic_id: 1, // 自由主题 id 默认为 1
        created_at: OffsetDateTime::now_local().unwrap().unix_timestamp() as u64,
    };
    conn.execute(CONVERSATION_INSERT, (free.created_at, free.topic_id))
        .unwrap();
}
