/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   model.ts
 * Created At:  2023-03-21 21:03:22
 * Modified At: 2023-03-21 21:08:19
 * Modified By: thepoy
 */

export enum Model {
  GPT_3 = 'GPT-3',
  DALL_E = 'DALL-E',
  GPT_3_ADA = 'GPT-3 ADA',
  GPT_3_Codex = 'GPT-3 Codex',
  GPT_3_Curie = 'GPT-3 Curie',
  GPT_3_Babbage = 'GPT-3 Babbage',
}

export const ModelDescription: Record<Model, string> = {
  'GPT-3': '一个大型的语言模型，可以用于多种自然语言处理任务，如文本生成、翻译、问答等。',
  'DALL-E': '一个生成图像的模型，可以根据文字描述生成符合要求的图像。',
  'GPT-3 ADA': '一个适用于有障碍的用户的模型，它可以处理语音识别、文本生成等任务。',
  'GPT-3 Codex': '一个可以理解代码的模型，可以用于编程和代码自动生成等任务。',
  'GPT-3 Curie': '一个速度更快的模型，可以处理实时应用。',
  'GPT-3 Babbage': '一个适用于嵌入式设备和移动设备的模型，可以在资源受限的情况下进行文本处理任务。'
}
