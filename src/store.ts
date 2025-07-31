import Dexie, { type EntityTable } from 'dexie'
import type { Solution } from './utils'

export const db = new Dexie('logicproblems') as Dexie & {
  solutions: EntityTable<Solution, 'id'>
}

db.version(1).stores({
  solutions: '++id, problemId, completedAt',
})

/****
 * Helper functions for initiating persistent storage.
 * Ripped from https://dexie.org/docs/StorageManager.
 */
await (async () => {
  return (await navigator.storage) && navigator.storage.persist
    ? navigator.storage.persist()
    : undefined
})()
