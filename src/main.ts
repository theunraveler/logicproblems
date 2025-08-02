import '@/scss/styles.scss'

import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'
import App from '@/App.vue'
import LoadDataPlugin from '@/plugins/data'
import RollbarPlugin from '@/plugins/rollbar'
import ThemePlugin from '@/plugins/theme'
import UnheadPlugin from '@/plugins/unhead'
import router from '@/router'

const app = createApp(App)

app.use(router)
app.use(createBootstrap())
app.use(LoadDataPlugin)
app.use(RollbarPlugin)
app.use(ThemePlugin)
app.use(UnheadPlugin)

app.mount('#app')
