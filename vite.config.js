import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => ({
  plugins: [vue(), tailwindcss(), ...(mode === 'development' ? [vueDevTools({ componentInspector: true })] : [])],
  server: {
    // 暴露局域网访问：终端会显示 Network 地址，手机/局域网设备可访问
    host: true
  },
  test: {
    environment: 'node'
  }
}))
