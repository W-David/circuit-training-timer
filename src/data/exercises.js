const DEFAULT = [
  { name: '深蹲', work: 40, rest: 20 },
  { name: '俯卧撑', work: 40, rest: 20 },
  { name: '波比跳', work: 40, rest: 20 },
]

export function makeExercise(work = 30, rest = 10) {
  return { name: '', work, rest }
}

export function defaultExercises() {
  return JSON.parse(JSON.stringify(DEFAULT))
}
