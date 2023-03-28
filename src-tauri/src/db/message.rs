use super::new_connection;

const USER_MESSAGE_TABLE: &str = r#"
    CREATE TABLE IF NOT EXISTS user_message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        conversation_id INTEGER NOT NULL,
        CONSTRAINT fk_conversation 
        FOREIGN KEY (conversation_id)
        REFERENCES conversation (id)
    )
"#;
const USER_MESSAGE_INSERT: &str = r#"
    INSERT INTO user_message (message, created_at, conversation_id)
    VALUES (?1, ?2, ?3);
"#;

pub struct UserMessage {
    id: u32,
    message: String,
    created_at: u64,
    conversation_id: u32,
}

impl UserMessage {
    pub fn new(message: String, created_at: u64, conversation_id: u32) -> Self {
        return UserMessage {
            id: 0,
            message,
            created_at,
            conversation_id,
        };
    }

    pub fn insert(self) {
        let conn = new_connection().unwrap();

        conn.execute(
            USER_MESSAGE_INSERT,
            (self.message, self.created_at, self.conversation_id),
        )
        .unwrap();
    }
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

    pub fn insert(self) {
        let conn = new_connection().unwrap();

        conn.execute(
            CHATGPT_MESSAGE_INSERT,
            (self.message, self.created_at, self.user_message_id),
        )
        .unwrap();
    }
}

pub(crate) fn init_messages() {
    let conn = new_connection().unwrap();
    conn.execute(USER_MESSAGE_TABLE, ()).unwrap();
    conn.execute(CHATGPT_MESSAGE_TABLE, ()).unwrap();
}
