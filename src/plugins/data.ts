import type { App, InjectionKey } from 'vue'
import { default as numberToWords } from 'number-to-words'
import { titleCase } from 'title-case'

const _problems: Record<string, Omit<Problem, 'id'>> = (
  await import('@/data/problems.json', { assert: { type: 'json' } })
).default
export const problems: ProblemList = Object.fromEntries(Object.entries(_problems).map(([ id, problem ]) => {
  return [id, { id, ...problem }]
}))

export type ProblemList = Record<string, Problem>

export interface Problem {
  id: string
  title: string
  chapter: number
  premises: string[]
  conclusion: string
}

export const problemsInjectionKey = Symbol() as InjectionKey<ProblemList>

export type ChapterList = Record<number, string>

export const chaptersInjectionKey = Symbol() as InjectionKey<ChapterList>

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
