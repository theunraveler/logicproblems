import './assets/main.css'

import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'
import { default as numberToWords } from 'number-to-words'
import { titleCase } from 'title-case'
import problems from './data/problems.json' with {type: 'json'}
import App from './App.vue'
import * as utils from './utils'
import router from './router.ts'

const app = createApp(App)

app.use(router)
app.use(createBootstrap())

app.provide(utils.problemsInjectionKey, problems);
app.provide(utils.chaptersInjectionKey, Object.fromEntries(
  [...new Set(Object.values(problems).map((p) => p.chapter))]
  .sort()
  .filter((c) => !!c)
  .map((c) => [c, `Chapter ${titleCase(numberToWords.toWords(c))}`])
));

app.mount('#app')
