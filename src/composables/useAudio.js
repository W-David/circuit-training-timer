// 复用同一个 AudioContext，避免每次蜂鸣新建导致上下文数量超限
let ctx = null
let speakTimer = null
let settingsRef = null

export function useAudio(settings) {
  if (settings) settingsRef = settings

  function prime() {
    // 在用户点击“开始训练”的手势内创建并恢复 AudioContext（iOS 需要）
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC || ctx) return
    try {
      ctx = new AC()
      if (ctx.state === 'suspended') ctx.resume()
    } catch { /* audio not available */ }
  }

  function speak(text) {
    if (settingsRef?.muted) return
    if (!('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    clearTimeout(speakTimer)
    // Chrome 中 cancel() 紧接着 speak() 会把新播报一起取消，稍作延迟再播
    speakTimer = setTimeout(() => {
      if (settingsRef?.muted) return
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'zh-CN'
      u.rate = 1
      u.pitch = 1.1
      u.volume = 0.9
      speechSynthesis.speak(u)
    }, 60)
  }

  function beep(frequency = 800, duration = 0.15, volume = 0.3) {
    if (settingsRef?.muted) return
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      if (!ctx) ctx = new AC()
      if (ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency
      gain.gain.value = volume
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch { /* audio not available */ }
  }

  function cancel() {
    clearTimeout(speakTimer)
    if ('speechSynthesis' in window) speechSynthesis.cancel()
  }

  return { prime, speak, beep, cancel }
}
