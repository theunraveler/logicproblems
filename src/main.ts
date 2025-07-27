import './scss/styles.scss'

import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'
import App from '@/App.vue'
import LoadDataPlugin from '@/plugins/data'
import RollbarPlugin from '@/plugins/rollbar'
import router from '@/router'

const app = createApp(App)

app.use(router)
app.use(createBootstrap())
app.use(LoadDataPlugin)
app.use(RollbarPlugin)

app.mount('#app')
