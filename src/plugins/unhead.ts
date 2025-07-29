import type { App } from 'vue'
import { createHead } from '@unhead/vue/client'
import { TemplateParamsPlugin } from 'unhead/plugins'

export default (app: App) => {
  const head = createHead({
    init: [
      {
        title: '',
        titleTemplate: '%s %separator Logic Problems',
        templateParams: {
          separator: '|',
        },
      },
    ],
    plugins: [TemplateParamsPlugin],
  })
  app.use(head)
}
