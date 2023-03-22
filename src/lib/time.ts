/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   time.ts
 * Created At:  2023-03-22 19:21:46
 * Modified At: 2023-03-22 19:37:01
 * Modified By: thepoy
 */

export const formatTime = (time: Date | number | null = null, withMilliseconds: boolean = false): string => {
  let t: Date

  if (time == null) {
    t = new Date()
  } else if (typeof time === 'number') {
    t = new Date(time)
  } else {
    t = time
  }

  const year = t.getFullYear()
  const month = t.getMonth() + 1
  const day = t.getDate()
  const hours = t.getHours()
  const minutes = t.getMinutes()
  const seconds = t.getSeconds()

  if (withMilliseconds) {
    const mills = t.getMilliseconds()

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${mills}`
  }

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const now = (withMilliseconds: boolean = false): number => {
  const date = new Date()

  return date.getTime()
}

export const nowWithFormat = (withMilliseconds: boolean = false): string => {
  return formatTime(null, withMilliseconds)
}
