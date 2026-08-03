import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => ({
  plugins: [vue(), tailwindcss(), ...(mode === 'development' ? [vueDevTools({ componentInspector: true })] : [])],
  test: {
    environment: 'node'
  }
}))
