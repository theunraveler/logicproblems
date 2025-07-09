import type { InjectionKey } from 'vue'

export type ProblemList = {
  [key: string]: Problem;
};

export interface Problem {
  title: string;
  chapter: number;
  assumptions: string[];
  conclusion: string;
};

export const problemsInjectionKey = Symbol() as InjectionKey<ProblemList>

export type ChapterList = {
  [key: number]: string;
};

export const chaptersInjectionKey = Symbol() as InjectionKey<ChapterList>
