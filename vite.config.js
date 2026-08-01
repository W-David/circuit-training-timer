import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => ({
  plugins: [vue(), vueDevTools({ componentInspector: mode === 'development' })].filter(Boolean),
  test: {
    environment: 'node'
  }
}))
