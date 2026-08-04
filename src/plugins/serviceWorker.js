// Service Worker 注册与版本更新检测

// 页面收到此事件时说明新版本 SW 已接管，App 可展示“发现新版本”提示
export const SW_UPDATE_EVENT = 'ct3:update-ready'

export function setupServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  // 首次访问（此前没有 SW 控制页面）不提示；已有旧版 SW 时，
  // 新版本 SW 接管页面会触发 controllerchange，借此通知“有新版本”
  const hadController = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) window.dispatchEvent(new CustomEvent(SW_UPDATE_EVENT))
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .then((registration) => {
        // 切回前台时主动检查一次更新，缩短发布后收到提示的延迟
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) registration.update().catch(() => {})
        })
      })
      .catch(() => {})
  })
}
