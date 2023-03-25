/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   index.ts
 * Created At:  2023-03-25 19:44:40
 * Modified At: 2023-03-25 19:46:18
 * Modified By: thepoy
 */

export const smoothScrollTo = (element: HTMLElement, to: number, duration: number): void => {
  const start = element.scrollTop
  const change = to - start
  const startDate = new Date()

  const animateScroll = (): void => {
    const currentDate = new Date()
    const elapsedTime = currentDate.getTime() - startDate.getTime()

    element.scrollTop = easeInOut(elapsedTime, start, change, duration)
    if (elapsedTime < duration) {
      requestAnimationFrame(animateScroll)
    } else {
      element.scrollTop = to
    }
  }

  const easeInOut = (t: number, b: number, c: number, d: number): number => {
    t /= d / 2
    if (t < 1) {
      return c / 2 * t * t + b
    }
    t--

    return -c / 2 * (t * (t - 2) - 1) + b
  }

  requestAnimationFrame(animateScroll)
}

export * from './Scrollbar'
