import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next'
import IconsResolve from 'unplugin-icons/resolver'
import viteRollbar from 'vite-plugin-rollbar-sourcemap'
import childProcess from 'child_process'
import packageInfo from './package.json'

const commit = childProcess.execSync('git rev-parse --short HEAD').toString().trim()

const plugins = [
  vue(),
  vueDevTools(),
  Components({
    resolvers: [BootstrapVueNextResolver(), IconsResolve()],
  }),
  Icons({
    compiler: 'vue3',
    autoInstall: true,
  }),
]

if (process.env.ROLLBAR_POST_SERVER_ITEM_ACCESS_TOKEN) {
  plugins.push(viteRollbar({
    accessToken: process.env.ROLLBAR_POST_SERVER_ITEM_ACCESS_TOKEN,
    version: commit,
    baseUrl: 'logicproblems.org',
    ignoreUploadErrors: false,
    silent: false,
  }))
}

export default defineConfig({
  plugins: plugins,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['import', 'mixed-decls', 'color-functions', 'global-builtin'],
      },
    },
  },
  define: {
    ['import.meta.env.GIT_COMMIT_SHA']: JSON.stringify(commit),
    ['import.meta.env.GITHUB_URL']: JSON.stringify(packageInfo.homepage),
    ['import.meta.env.BRANCH']: JSON.stringify(process.env.WORKERS_CI_BRANCH),
    ['import.meta.env.ROLLBAR_POST_CLIENT_ITEM_ACCESS_TOKEN']: JSON.stringify(process.env.ROLLBAR_POST_CLIENT_ITEM_ACCESS_TOKEN),
  },
})
