import { describe, it, expect } from 'vitest'
import { backupFileName } from './backup.js'

describe('backupFileName', () => {
  it('按 YYYYMMDD 生成中文备份文件名', () => {
    expect(backupFileName(new Date(2026, 7, 3))).toBe('循环计时器-备份-20260803.json')
  })

  it('月/日不足两位时补零', () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe('循环计时器-备份-20260105.json')
  })
})
