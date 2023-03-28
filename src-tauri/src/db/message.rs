const USER_MESSAGE_TABLE: &str = r#"
    CREATE TABLE IF NOT EXISTS user_message (
        id INTEGER PRIMARY KEY,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        conversation_id INTEGER NOT NULL,
        CONSTRAINT fk_conversation 
        FOREIGN KEY (conversation_id)
        REFERENCES conversation (id)
    )
"#;

const CHATGPT_MESSAGE_TABLE: &str = r#"
    CREATE TABLE IF NOT EXISTS chatgpt_message (
        id INTEGER PRIMARY KEY,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        user_message_id INTEGER NOT NULL,
        CONSTRAINT fk_user_message
        FOREIGN KEY (user_message_id)
        REFERENCES user_message (id)
    )
"#;
