import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import { setupServiceWorker } from './plugins/serviceWorker.js'
import './styles/main.css'

setupServiceWorker()

createApp(App).use(router).mount('#app')
