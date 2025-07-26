import * as Shepherd from 'shepherd.js'

type HTMLValueElement = HTMLInputElement | HTMLSelectElement

export const advanceOnValue = (
  tour: Shepherd.Tour,
  selector: string,
  eventName: string,
  value: string,
) => {
  const listener = (event: Event) => {
    const element = event.target as HTMLValueElement

    if (!element?.value || element.value !== value) {
      return
    }

    element.removeEventListener(eventName, listener)
    tour.next()
  }

  document.querySelector(selector)?.addEventListener(eventName, listener)
}

export const advanceWhenChecked = (tour: Shepherd.Tour, selector: string, ms: number = 100) => {
  const interval = setInterval(() => {
    const elements = Array.from(document.querySelectorAll(selector))
    if (!elements.every((element) => (element as HTMLInputElement).checked)) {
      return
    }
    clearInterval(interval)
    tour.next()
  }, ms)
}

export const waitForElement = (selector: string, ms: number = 100) => {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (!document.querySelector(selector)) {
        return
      }
      clearInterval(interval)
      resolve()
    }, ms)
  })
}
