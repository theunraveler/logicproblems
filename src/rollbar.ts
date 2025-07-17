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

const POST_CLIENT_ITEM_TOKEN =
  '317399a7c3e04e89a04d588e9850e9e4862d9ea5f99b5479edab6102ff07ae90e156ff98b6b041aadbb4a18b5d3b4285'

export default {
  install(app: App) {
    const rollbar = new Rollbar({
      enabled: import.meta.env.PROD,
      accessToken: POST_CLIENT_ITEM_TOKEN,
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

    app.config.errorHandler = (error, vm, info) => {
      rollbar.error(error as Rollbar.LogArgument, { info })
      if (import.meta.env.PROD) {
        alert('An error has occurred. Please refresh the page and try again.')
      } else {
        console.error(error)
      }
    }
    app.provide('rollbar', rollbar)
  },
}
