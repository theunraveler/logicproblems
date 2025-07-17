import './scss/styles.scss'

import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'
import { default as numberToWords } from 'number-to-words'
import { titleCase } from 'title-case'
import App from './App.vue'
import { chaptersInjectionKey, problems, problemsInjectionKey } from './utils'
import RollbarPlugin from './rollbar.ts'
import router from './router.ts'

const app = createApp(App)

app.use(router)
app.use(createBootstrap())
app.use(RollbarPlugin)

app.provide(problemsInjectionKey, problems)
app.provide(
  chaptersInjectionKey,
  Object.fromEntries(
    [...new Set(Object.values(problems).map((p) => p.chapter))]
      .sort()
      .filter((c) => !!c)
      .map((c) => [c, `Chapter ${titleCase(numberToWords.toWords(c))}`]),
  ),
)

app.mount('#app')
