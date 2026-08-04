import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { createHash } from 'node:crypto'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

async function walkFiles(dir) {
  const files = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walkFiles(full)))
    else files.push(full)
  }
  return files
}

// 把构建产物指纹注入 sw.js 的 BUILD_ID 占位符：
// 应用代码一旦变化，sw.js 内容也随之变化，浏览器会安装新版本 SW，
// 页面借此收到“有新版本”的信号
function injectSwBuildId() {
  let outDir = 'dist'
  return {
    name: 'vite:inject-sw-build-id',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    async closeBundle() {
      const swPath = resolve(outDir, 'sw.js')
      let source
      try {
        source = await readFile(swPath, 'utf8')
      } catch {
        return
      }
      if (!source.includes('__BUILD_ID__')) return

      const files = (await walkFiles(outDir)).filter((f) => f !== swPath).sort()
      const digest = createHash('sha256')
      for (const file of files) {
        const info = await stat(file)
        if (!info.isFile()) continue
        digest.update(file.slice(outDir.length))
        digest.update(await readFile(file))
      }
      const buildId = digest.digest('hex').slice(0, 12)
      await writeFile(swPath, source.replaceAll('__BUILD_ID__', buildId))
    },
  }
}

export default defineConfig(({ mode }) => ({
  // 子路径部署（如 GitHub Pages 项目站）时用 VITE_BASE=/仓库名/ 构建
  base: process.env.VITE_BASE || '/',
  plugins: [injectSwBuildId(), vue(), tailwindcss(), ...(mode === 'development' ? [vueDevTools({ componentInspector: true })] : [])],
  server: {
    // 暴露局域网访问：终端会显示 Network 地址，手机/局域网设备可访问
    host: true
  },
  test: {
    environment: 'node'
  }
}))
