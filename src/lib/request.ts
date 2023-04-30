/*
 * author   thepoy
 * file     request.ts
 * created  2023-04-21 13:15:16
 * modified 2023-04-21 13:15:16
 */

import { Models } from './model'

export const newChatRequest = (sendedMessages: ChatMessage[], stream: boolean, temperature: number, model = Models.GPT_3_5): ChatGPTRequest => {
  return {
    temperature,
    messages: sendedMessages,
    model,
    stream
  }
}
