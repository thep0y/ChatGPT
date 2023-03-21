/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   chat.d.ts
 * Created At:  2023-03-21 20:38:24
 * Modified At: 2023-03-21 23:44:00
 * Modified By: thepoy
 */

declare interface Message {
  role: string
  content: string
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
