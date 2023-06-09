/*
 * author   thepoy
 * file     messasge.d.ts
 * created  2023-03-30 14:15:25
 * modified 2023-03-30 14:15:25
 */

interface MessageListProps {
  messages: Message[]
  showTopicList: boolean
  showLineNumbers: boolean
}

interface MessageInputProps {
  onSendMessage: (message: string, stream: boolean) => Promise<void>
  onAbortStream: () => void
  resetMessageList: () => void
  redo: () => Promise<boolean>
  waiting: boolean
  config: Config
  topicID: string
  retry: boolean
  lastUserMessage: string
}

declare interface Topic {
  id: number
  name: string
  description: string
  created_at: number
}

declare interface UserMessage {
  id: number
  message: string
  created_at: number
  topic_id: number
}

declare interface AssistantMessage {
  id: number
  message: string
  created_at: number
  user_message_id: number
}

declare interface Conversation {
  user: UserMessage
  assistant: AssistantMessage
}
