/**
 * 常用 Tailwind 工具类组合（替代原 main.css 中对应的组件类）。
 * 保持单一维护点，避免在模板中重复十余个类名。
 */

const BTN_BASE = [
  'inline-flex',
  'items-center',
  'gap-[5px]',
  'px-4',
  'py-2',
  'rounded-control',
  'text-[0.85rem]',
  'font-semibold',
  'font-[inherit]',
  'cursor-pointer',
  'transition-all',
  'duration-200',
  'active:scale-[0.97]',
].join(' ')

/** 无边框按钮基础（主色/危险按钮、单独使用的 BTN） */
export const BTN = BTN_BASE + ' border-none'

export const BTN_PRIMARY = [
  BTN_BASE,
  'border-none',
  'bg-accent',
  'bg-[image:var(--grad-main)]',
  'text-white',
  'shadow-[var(--glow-main),inset_0_1px_0_rgba(255,255,255,0.22)]',
  'hover:brightness-110',
].join(' ')

export const BTN_GHOST = [
  BTN_BASE,
  'border!',
  'bg-transparent',
  'border-line',
  'text-ink',
  'hover:bg-[rgba(255,255,255,0.04)]',
  'hover:border-line-bright',
].join(' ')

export const BTN_DANGER = [
  BTN_BASE,
  'border-none',
  'bg-danger',
  'bg-[image:linear-gradient(135deg,#f87171,#dc2626)]',
  'text-white',
  'shadow-[0_8px_20px_-8px_rgba(239,68,68,0.55),inset_0_1px_0_rgba(255,255,255,0.22)]',
  'hover:brightness-[1.08]',
].join(' ')

/** 尺寸变体用 ! 强制覆盖 BTN_BASE 中的对应值 */
export const BTN_SM = 'px-3! py-[5px]! text-[0.78rem]!'

export const BTN_LG = 'px-8! py-[14px]! text-[1rem]! rounded-card!'

/** 整块按钮：display 用 flex! 覆盖基础 inline-flex */
export const BTN_BLOCK = 'flex! w-full justify-center'

export const BTN_ICON = [
  'bg-transparent',
  'border-none',
  'text-ink-2',
  'cursor-pointer',
  'text-[1rem]',
  'p-1',
  'rounded-[4px]',
  'opacity-50',
  'transition-all',
  'duration-200',
  'hover:opacity-100',
].join(' ')

/** 悬浮图标按钮（全屏/静音），替代 .fs-btn / .icon-btn */
export const ICON_BTN = [
  'size-9',
  'rounded-[10px]',
  'border',
  'border-line',
  'bg-surface',
  'text-ink-2',
  'cursor-pointer',
  'inline-flex',
  'items-center',
  'justify-center',
  'transition-all',
  'duration-200',
  'opacity-50',
  'p-0',
  'font-[inherit]',
  'hover:opacity-100',
  'hover:border-accent',
  'hover:text-ink',
  'hover:shadow-[0_4px_16px_-6px_rgba(124,111,247,0.5)]',
  'aria-pressed:opacity-100',
  'aria-pressed:border-danger',
  'aria-pressed:text-danger',
].join(' ')

/** 编辑器页的固定全屏按钮 */
export const FAB = ICON_BTN + ' fixed top-4 right-4 z-50'

/** 计时/总结页右上角操作区 */
export const TOP_ACTIONS = 'fixed top-4 right-4 z-50 flex gap-2'

/** 通用卡片（替代 .card） */
export const CARD = [
  'bg-[linear-gradient(180deg,var(--surface2)_0%,var(--surface)_100%)]',
  'border',
  'border-line',
  'rounded-card',
  'p-[18px]',
  'mb-3.5',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]',
].join(' ')
