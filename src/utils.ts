import type { InjectionKey } from 'vue'
import _humanizeDuration from 'humanize-duration'

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

export interface UnsavedSolution {
  problemId: string
  completedAt: number
  completedIn: number
  lines: [string, string, number[]][]
}

export interface Solution extends UnsavedSolution {
  id: number
}

export const humanizeDuration = (d: number): string => _humanizeDuration(d, { round: true })

export const humanizeTimestamp = (ts: number): string => {
  const date = new Date(ts)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}
