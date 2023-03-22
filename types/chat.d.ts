/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   chat.d.ts
 * Created At:  2023-03-21 20:38:24
 * Modified At: 2023-03-22 19:20:40
 * Modified By: thepoy
 */

type Role = 'user' | 'assistant'

declare interface Message {
  role: Role
  content: string
  time: number
}

declare interface ChatGPTRequest {
  model: string
  messages: Message[]
}

interface Choice {
  index: number
  message: Message
  finish_reason: string
}

interface Usage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

declare interface ChatGPTResponse {
  id: string
  object: string
  created: number
  choices: Choice[]
  usage: Usage
}

declare interface ChatBubbleProps {
  message: string
  role: Role
  avatar?: string
  time: string
}
