import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import './styles/main.css'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {})
  })
}

createApp(App).use(router).mount('#app')
