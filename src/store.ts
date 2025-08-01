import Dexie, { type EntityTable } from 'dexie'
import type { Solution } from './utils'

export const db = new Dexie('logicproblems') as Dexie & {
  solutions: EntityTable<Solution, 'id'>
}

db.version(1).stores({
  solutions: '++id, problemId, completedAt',
})

/**
 * This is a wrapper for `.uniqueKeys()` to catch a known error in Safari. See
 * https://github.com/dexie/Dexie.js/issues/1052 and remove this when that's
 * fixed.
 */
export const uniqueKeys = async (query: Dexie.Collection): Promise<string[]> => {
  try {
    return (await query.uniqueKeys()) as string[]
  } catch (error) {
    if (error instanceof Dexie.UnknownError) {
      return []
    } else {
      throw error
    }
  }
}

/****
 * Helper functions for initiating persistent storage.
 * Ripped from https://dexie.org/docs/StorageManager.
 */
if (import.meta.env.PROD) {
  await (async () => {
    return (await navigator.storage) && navigator.storage.persist
      ? navigator.storage.persist()
      : undefined
  })()
}
