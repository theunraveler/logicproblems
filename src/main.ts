import * as bootstrap from 'bootstrap/dist/js/bootstrap.bundle';
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router.ts'

const app = createApp(App)

app.use(router)

app.provide('bootstrap', bootstrap);
app.mount('#app')
