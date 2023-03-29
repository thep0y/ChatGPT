/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   chat.d.ts
 * Created At:  2023-03-21 20:38:24
 * Modified At: 2023-03-29 19:54:32
 * Modified By: thepoy
 */

type Role = 'user' | 'assistant'

declare interface ChatMessage {
  role: Role
  content: string
}

declare type Message = ChatMessage & { time: number }

declare interface ChatGPTRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  top_p?: number
  n?: number
  stream?: boolean
  stop?: number
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
  user?: string
}

interface Choice {
  index: number
  message: ChatMessage
  finish_reason: string
}

interface StreamChoiceDelta {
  role?: Role
  content?: string
}

interface StreamChoice {
  delta: StreamChoiceDelta
  index: number
  finish_reason: string
}

interface Usage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

declare interface ChatGPTResponse<T = Choice | StreamChoice> {
  id: string
  object: string
  created: number
  choices: T[]
  usage: Usage
  model: string
}

declare interface Saving {
  name: string
  status: boolean
}

declare interface Topic {
  id: number
  name: string
}
