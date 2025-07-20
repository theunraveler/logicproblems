import Dexie, { type EntityTable } from 'dexie'
import type { Solution } from './utils'

export const db = new Dexie('logicproblems') as Dexie & {
  solutions: EntityTable<Solution, 'id'>
}

db.version(1).stores({
  solutions: '++id, problemId, completedAt',
})
