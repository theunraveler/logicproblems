import type { App } from 'vue'
import { default as numberToWords } from 'number-to-words'
import { titleCase } from 'title-case'
import { chaptersInjectionKey, problems, problemsInjectionKey } from '@/utils'

export default (app: App) => {
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
}
