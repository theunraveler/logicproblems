import { toRaw } from 'vue'
import _humanizeDuration from 'humanize-duration'
import { Line, Proof } from '@/logic'

export type SerializedLine = [string, string, number[]]

export interface Solution {
  id: number
  problemId: string
  completedAt: number
  completedIn: number
  lines: SerializedLine[]
}

export type SolutionProps = Omit<Solution, 'id'>

export const humanizeDuration = (d: number): string => _humanizeDuration(d, { round: true })

export const humanizeTimestamp = (ts: number): string => {
  const date = new Date(ts)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

export const compressProofLines = (proof: Proof): SerializedLine[] => {
  return proof.deductions.map((l: Line) => {
    return [
      l.formula.toString().replaceAll(' ', ''),
      l.rule.toString().replaceAll(' ', ''),
      toRaw(l.justifications),
    ]
  })
}
