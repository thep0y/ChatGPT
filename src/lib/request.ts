/*
 * author   thepoy
 * file     request.ts
 * created  2023-04-21 13:15:16
 * modified 2023-04-21 13:15:16
 */

export const newChatRequest = (sendedMessages: ChatMessage[], stream: boolean, model = 'gpt-3.5-turbo'): ChatGPTRequest => {
  return {
    messages: sendedMessages,
    model,
    stream
  }
}
