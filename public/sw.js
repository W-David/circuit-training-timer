// 构建时由 vite 注入产物指纹，保证每次发布 sw.js 字节都会变化，
// 浏览器才能检测到新版本并触发更新提示
const BUILD_ID = '__BUILD_ID__'
const CACHE = 'ct3-v4'
// 以 SW 作用域为基准解析路径，兼容根路径与子路径（GitHub Pages）部署
const scope = self.registration.scope
const indexUrl = new URL('index.html', scope).href
const APP_SHELL = ['index.html', 'manifest.webmanifest', 'icon.svg'].map(
  (p) => new URL(p, scope).href,
)

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // 导航请求：network-first，保证新版本尽快生效；离线时回退缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE).then((cache) => cache.put(indexUrl, clone))
          return res
        })
        .catch(() => caches.match(indexUrl)),
    )
    return
  }

  // 其余静态资源：cache-first + 后台更新
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const clone = res.clone()
            caches.open(CACHE).then((cache) => cache.put(request, clone))
          }
          return res
        })
        .catch(() => cached)
      return cached || fetched
    }),
  )
})
