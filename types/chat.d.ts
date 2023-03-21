/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   chat.d.ts
 * Created At:  2023-03-21 20:38:24
 * Modified At: 2023-03-21 20:44:02
 * Modified By: thepoy
 */

declare interface Message {
  text: string
  timestamp?: Date
  sender: string
}
