export function useAudio() {
  function speak(text) {
    if (!('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = 1
    u.pitch = 1.1
    u.volume = 0.9
    speechSynthesis.speak(u)
  }

  function beep(frequency = 800, duration = 0.15, volume = 0.3) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
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
    if ('speechSynthesis' in window) speechSynthesis.cancel()
  }

  return { speak, beep, cancel }
}
