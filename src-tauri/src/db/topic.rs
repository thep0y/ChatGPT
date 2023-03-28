use super::new_connection;
use time::OffsetDateTime;

const TOPIC_TABLE: &str = r#"
    CREATE TABLE IF NOT EXISTS topic (
        id INTEGER PRIMARY KEY,
        name VARCHAR(20) NOT NULL,
        created_at INTEGER NOT NULL
    )
"#;

const TOPIC_INSERT: &str = r#"
    INSERT INTO topic (name, created_at) VALUES (?1, ?2)
"#;

pub struct Topic {
    id: u32,
    name: String,
    created_at: i64,
}

impl Topic {
    pub fn new(name: &str, created_at: &i64) -> Self {
        return Topic {
            id: 0,
            name: name.into(),
            created_at: *created_at,
        };
    }

    pub fn insert(self) {
        let conn = new_connection().unwrap();

        conn.execute(TOPIC_INSERT, (self.name, self.created_at))
            .unwrap();
    }
}

pub fn init_topic() {
    let conn = new_connection().unwrap();
    conn.execute(TOPIC_TABLE, ()).unwrap();

    let free = Topic {
        id: 0,
        name: "自由对话".into(),
        created_at: OffsetDateTime::now_local().unwrap().unix_timestamp(),
    };
    conn.execute(TOPIC_INSERT, (free.name, free.created_at))
        .unwrap();
}
