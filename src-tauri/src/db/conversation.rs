const CONVERSATION_TABLE: &str = r#"
    CREATE TABLE IF NOT EXISTS conversation (
        id INTEGER PRIMARY KEY,
        created_at INTEGER NOT NULL,
        topic_id INTEGER NOT NULL,
        CONSTRAINT fk_topic 
        FOREIGN KEY (topic_id)
        REFERENCES topic (id)
    )
"#;
