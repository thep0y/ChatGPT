/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   chat.d.ts
 * Created At:  2023-03-21 20:38:24
 * Modified At: Thu Mar 23 2023
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
  message: Omit<Message, 'time'>
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
