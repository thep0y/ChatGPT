use std::convert::TryFrom;

/// 用户消息的保存形式
pub enum UserMessageMode {
    /// 作为二级标题
    Title,
    /// 作为引用块
    Quote,
}

impl TryFrom<usize> for UserMessageMode {
    type Error = &'static str;

    fn try_from(value: usize) -> Result<Self, Self::Error> {
        match value {
            1 => Ok(UserMessageMode::Title),
            2 => Ok(UserMessageMode::Quote),
            _ => Err("Invalid value"),
        }
    }
}

pub fn format_user_message(text: &str, mode: UserMessageMode) -> String {
    match mode {
        UserMessageMode::Title => format!("## {}\n", text),
        UserMessageMode::Quote => text
            .lines()
            .map(|line| {
                if line.is_empty() {
                    ">\n".to_string()
                } else {
                    format!("> {}\n", line)
                }
            })
            .collect::<String>(), // let mut lines = text.lines().peekable();
                                  // let mut result = String::new();

                                  // while let Some(line) = lines.next() {
                                  //     if line.is_empty() {
                                  //         result.push_str(">\n");
                                  //     } else {
                                  //         result.push_str(&format!("> {}\n", line));
                                  //     }
                                  // }
    }
}
