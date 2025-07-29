import { computed } from 'vue'
import { createSharedComposable, StorageSerializers, useStorage } from '@vueuse/core'

export const _useTour = (name: string, steps: Step[] = []) => {
  const currentStepName = useStorage(`${name}-tour`, null, undefined, {
    serializer: StorageSerializers.string,
  })
  const currentStep = computed(() => steps[currentStepName.value])

  return { currentStepName, currentStep }
}

export const useTour = createSharedComposable(_useTour)

export interface CallbackParams {
  next: () => void
  complete: () => void
  cancel: () => void
}

type HTMLValueElement = HTMLInputElement | HTMLSelectElement
type Callback = (params: CallbackParams) => void;
type Button = [string, Callback]

export const buttons: Record<string, Button> = {
  next: ['Next', ({ next }) => next()],
  complete: ['Finish', ({ complete }) => complete()],
  cancel: ['Cancel', ({ cancel }) => cancel()],
}

type AdvanceOn = string | {
  selector?: string
  event: string
  value?: string
}

export interface Step {
  title?: string
  text: string
  attachTo: string | (() => Promise<string>)
  highlight?: string[]
  clickable?: boolean
  advanceOn?: AdvanceOn
  buttons?: Button[]
  onShow?: Callback
  onHide?: Callback
}

export const advanceWhenChecked = (next: () => void, selector: string, ms: number = 100) => {
  const interval = setInterval(() => {
    const elements = Array.from(document.querySelectorAll(selector))
    if (!elements.every((element) => (element as HTMLInputElement).checked)) {
      return
    }
    clearInterval(interval)
    next()
  }, ms)
}

export const waitForElement = (selector: string, ms: number = 100) => {
  return new Promise<string>((resolve) => {
    const interval = setInterval(() => {
      if (!document.querySelector(selector)) {
        return
      }
      clearInterval(interval)
      resolve(selector)
    }, ms)
  })
}

export const setHighlights = (selectors: string[], clickable: boolean = true, className: string = 'tour--current-step') => {

  document.querySelectorAll(`.${className}`).forEach((el) => {
    el.classList.remove(className, 'no-interaction')
  })

  const newClasses = [className]
  if (!clickable) {
    newClasses.push('no-interaction')
  }
  document.querySelectorAll(selectors.join(',')).forEach((el) => {
    el.classList.add(...newClasses)
  })
}

export const initAdvanceOn = (attachTo: string, step: Step, next: () => void) => {
  if (!step.advanceOn) {
    return
  }

  const props = typeof step.advanceOn === 'string'
    ? {
        selector: attachTo,
        event: step.advanceOn,
      }
    : {...{ selector: attachTo }, ...step.advanceOn}

  const el = document.querySelector(props.selector)

  if (!el) {
    throw new Error(`Could not find element ${props.selector}`)
  }

  const handler = (event: Event) => {
    const element = event.target as HTMLValueElement
    if (props.value && element.value !== props.value) {
      return
    }

    el.removeEventListener(props.event, handler)
    next()
  }
  el.addEventListener(props.event, handler)
}

export const ensureValue = (selector: string, value: string) => {
  const element = document.querySelector(selector) as HTMLInputElement
  element.blur()
  element.value = value
}
