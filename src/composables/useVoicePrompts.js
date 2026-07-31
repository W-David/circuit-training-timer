// 语音提示模块：集中管理训练各阶段的语音播报文案与触发规则。
// 规则统一为“提前 5 秒播报”，由 useWorkout 在对应时机调用。

export function startPrompt(step) {
  if (step.type === 'warmup') return '热身开始'
  if (step.type === 'work') return '开始' + step.name
  return null
}

export function stepChangePrompt(step) {
  if (step.type === 'work') return '开始' + step.name
  if (step.type === 'roundRest') return '本轮结束，休息一下'
  return null
}

export function nearEndPrompt(current, next) {
  if (!current) return null

  if (current.type === 'warmup') {
    return next ? '热身即将结束，下一个动作，' + next.name : '热身即将结束'
  }

  if (current.type === 'work') {
    if (!next) return '训练即将结束'
    if (next.type === 'rest' || next.type === 'roundRest') {
      return '即将休息' + next.seconds + '秒'
    }
    if (next.type === 'work') {
      return '本轮结束，即将开始下一轮，下一个动作，' + next.name
    }
    return null
  }

  if (current.type === 'rest') {
    if (!next) return '训练即将结束'
    if (next.type === 'work') return '下一个，' + next.name
    if (next.type === 'roundRest') return '本轮结束，即将休息' + next.seconds + '秒'
    return null
  }

  if (current.type === 'roundRest') {
    if (next && next.type === 'work') {
      return '本轮结束，即将开始下一轮，下一个动作，' + next.name
    }
    return null
  }

  return null
}

export function finishPrompt() {
  return '训练完成！辛苦了！'
}

export function useVoicePrompts(audio) {
  function speak(text) {
    if (text) audio?.speak?.(text)
  }

  return {
    onStart(step) {
      speak(startPrompt(step))
    },
    onStepChange(step) {
      speak(stepChangePrompt(step))
    },
    onNearEnd(current, next) {
      speak(nearEndPrompt(current, next))
    },
    onFinish() {
      speak(finishPrompt())
    },
  }
}
