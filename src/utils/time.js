/** MM:SS 显示（floor），倒计时展示可传 { ceil: true } 保证显示大于 0。 */
export function formatMMSS(sec, { ceil = false } = {}) {
  const t = Math.max(0, ceil ? Math.ceil(sec) : Math.floor(sec))
  const m = Math.floor(t / 60)
  return String(m).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0')
}
