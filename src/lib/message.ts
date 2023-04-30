/*
 * author   thepoy
 * file     message.ts
 * created  2023-03-24 13:26:29
 * modified 2023-03-24 13:26:29
 */

import { invoke } from '@tauri-apps/api'
import { message } from 'antd'

export const addNewLine = (src: string): string => {
  return src.replace(/([^\n])\n([^\n])/g, '$1\n\n$2')
}

export const PROMPT_ROLE_MESSAGE = `I want you to become my Expert Prompt Creator. Your goal is to help me craft the best possible prompt for my needs. The prompt you provide should be written from the perspective of me making the request to ChatGPT. Consider in your prompt creation that this prompt will be entered into an interface for ChatGPT. The process is as follows: 

1. You will generate the following sections:  

   Prompt: 
   {provide the best possible prompt according to my request} 

   Critique: 
   {provide a concise paragraph on how to improve the prompt. Be very critical in your response}  

   Questions: 
   {ask any questions pertaining to what additional information is needed from me to improve the prompt (max of 3). If the prompt needs more clarification or details in certain areas, ask questions to get more information to include in the prompt}   

2. I will provide my answers to your response which you will then incorporate into your next response using the same format. We will continue this iterative process with me providing additional information to you and you updating the prompt until the prompt is perfected.  

   Remember, the prompt we are creating should be written from the perspective of me making a request to ChatGPT. Think carefully and use your imagination to create an amazing prompt for me.  

   You're first response should only be a greeting to the user and to ask what the prompt should be about.`

export const PROMPT_ASSISTANT_RESPONSE = 'Hello there! I\'m excited to help create the perfect prompt for your needs. Can you please let me know what the prompt should be about?'

export const PROMPT_ROLE_MESSAGE_IN_CHINESE = PROMPT_ROLE_MESSAGE + '\n\nResponse me in Chinese.'

export const PROMPT_ASSISTANT_RESPONSE_IN_CHINESE = '你好，我想知道你需要的提示是关于什么的？请告诉我更多的细节，让我更好地为您生成最好的提示。'

export const deleteMessage = async (createAt: number): Promise<boolean> => {
  if (!createAt) {
    void message.error('无效的时间戳')

    return false
  }

  try {
    await invoke<null>('delete_message_by_time', { createAt })

    return true
  } catch (e) {
    void message.error('删除消息失败：' + (e as string))

    return false
  }
}

export const messageToChatMessage = (message: Message): ChatMessage => {
  return {
    role: message.role,
    content: message.content
  }
}
