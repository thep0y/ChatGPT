/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   index.ts
 * Created At:  2023-03-21 21:03:16
 * Modified At: 2023-03-26 20:50:48
 * Modified By: thepoy
 */

export * from './model'
export * from './time'
export * from './message'
export * from './config'

/**
 * isEqual 函数用于比较两个对象是否相等
 * @param obj1 要比较的第一个对象
 * @param obj2 要比较的第二个对象
 * @returns 如果两个对象相等则返回 true，否则返回 false
 */
export const isEqual = (obj1: any, obj2: any): boolean => {
  // 如果两个对象引用相同，返回 true
  if (obj1 === obj2) {
    return true
  }

  // 如果两个对象类型不同，返回 false
  if (typeof obj1 !== typeof obj2) {
    return false
  }

  // 如果两个对象都是基本类型或函数类型，直接比较它们的值
  if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
    return obj1 === obj2
  }

  // 如果两个对象都是数组，递归比较数组元素
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false
    }
    for (let i = 0; i < obj1.length; i++) {
      if (!isEqual(obj1[i], obj2[i])) {
        return false
      }
    }

    return true
  }

  // 如果两个对象都是对象，递归比较对象属性值
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) {
    return false
  }
  for (const key of keys1) {
    if (!isEqual(obj1[key], obj2[key])) {
      return false
    }
  }

  return true
}
