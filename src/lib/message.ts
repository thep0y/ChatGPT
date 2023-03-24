/*
 * author   thepoy
 * file     message.ts
 * created  2023-03-24 13:26:29
 * modified 2023-03-24 13:26:29
 */

export const addNewLine = (src: string): string => {
  return src.replace(/([^\n])\n([^\n])/g, '$1\n\n$2')
}
