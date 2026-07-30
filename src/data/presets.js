export const BUILTIN = [
  {
    key: 'f', icon: 'mdi:arm-flex', name: '全身力量',
    exercises: [
      { name: '深蹲', work: 45, rest: 15 },
      { name: '俯卧撑', work: 45, rest: 15 },
      { name: '引体向上/划船', work: 45, rest: 15 },
      { name: '卷腹', work: 45, rest: 15 },
      { name: '波比跳', work: 45, rest: 15 },
    ],
    rounds: 3, restBetweenRounds: 30,
  },
  {
    key: 'b', icon: 'mdi:run', name: '自重燃脂',
    exercises: [
      { name: '开合跳', work: 30, rest: 15 },
      { name: '高抬腿', work: 30, rest: 15 },
      { name: '登山跑', work: 30, rest: 15 },
      { name: '波比跳', work: 30, rest: 15 },
    ],
    rounds: 4, restBetweenRounds: 30,
  },
  {
    key: 'c', icon: 'mdi:target', name: '核心训练',
    exercises: [
      { name: '平板支撑', work: 40, rest: 10 },
      { name: '卷腹', work: 40, rest: 10 },
      { name: '俄罗斯转体', work: 40, rest: 10 },
    ],
    rounds: 3, restBetweenRounds: 20,
  },
  {
    key: 'h', icon: 'mdi:fire', name: 'HIIT 高强度',
    exercises: [
      { name: '冲刺跑', work: 20, rest: 10 },
      { name: '波比跳', work: 20, rest: 10 },
      { name: '深蹲跳', work: 20, rest: 10 },
      { name: '登山跑', work: 20, rest: 10 },
      { name: '开合跳', work: 20, rest: 10 },
      { name: '高抬腿', work: 20, rest: 10 },
      { name: '俯卧撑', work: 20, rest: 10 },
      { name: '卷腹', work: 20, rest: 10 },
    ],
    rounds: 2, restBetweenRounds: 60,
  },
  {
    key: 't', icon: 'mdi:lightning-bolt', name: 'Tabata',
    exercises: [
      { name: '波比跳', work: 20, rest: 10 },
      { name: '深蹲跳', work: 20, rest: 10 },
      { name: '登山跑', work: 20, rest: 10 },
      { name: '开合跳', work: 20, rest: 10 },
    ],
    rounds: 2, restBetweenRounds: 60,
  },
  {
    key: 'y', icon: 'mdi:meditation', name: '拉伸放松',
    exercises: [
      { name: '下犬式', work: 60, rest: 5 },
      { name: '猫牛式', work: 45, rest: 5 },
      { name: '鸽子式(左)', work: 45, rest: 5 },
      { name: '鸽子式(右)', work: 45, rest: 5 },
      { name: '婴儿式', work: 60, rest: 5 },
    ],
    rounds: 1, restBetweenRounds: 0,
  },
]
