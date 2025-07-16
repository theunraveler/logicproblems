import type { InjectionKey } from 'vue'

export const problems: ProblemList = (
  await import('./data/problems.json', { assert: { type: 'json' } })
).default

export type ProblemList = {
  [key: string]: Problem
}

export interface Problem {
  title: string
  chapter: number
  assumptions: string[]
  conclusion: string
}

export const problemsInjectionKey = Symbol() as InjectionKey<ProblemList>

export type ChapterList = {
  [key: number]: string
}

export const chaptersInjectionKey = Symbol() as InjectionKey<ChapterList>
