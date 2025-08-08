import type { App } from 'vue'
import Rollbar from 'rollbar'

const env: string = (() => {
  if (import.meta.env.BRANCH === 'main') {
    return 'production'
  } else if (import.meta.env.BRANCH) {
    return import.meta.env.BRANCH
  } else {
    return 'development'
  }
})()

export default (app: App) => {
  const rollbar = new Rollbar({
    enabled: !!import.meta.env.ROLLBAR_POST_CLIENT_ITEM_ACCESS_TOKEN,
    accessToken: import.meta.env.ROLLBAR_POST_CLIENT_ITEM_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
    payload: {
      environment: env,
      client: {
        javascript: {
          code_version: import.meta.env.GIT_COMMIT_SHA,
        },
      },
    },
  })

  app.provide('rollbar', rollbar)
}
