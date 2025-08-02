import { computed } from 'vue'
import type { App, InjectionKey, Ref } from 'vue'
import { useColorMode, type BasicColorSchema, type BasicColorMode } from '@vueuse/core'

const { system, store } = useColorMode({
  selector: 'body',
  attribute: 'data-bs-theme',
  storageKey: 'color-theme',
})
const current = computed(() => (store.value === 'auto' ? system.value : store.value))

export interface ColorMode {
  store: Ref<BasicColorSchema>
  system: Ref<BasicColorMode>
  current: Ref<BasicColorMode>
}

export const colorModeInjectionKey = Symbol() as InjectionKey<ColorMode>

export default (app: App) => {
  app.provide(colorModeInjectionKey, { store, system, current })
}
