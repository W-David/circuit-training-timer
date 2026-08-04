import { useRouter } from 'vue-router'
import { useWorkout } from './useWorkout.js'
import { usePresets } from './usePresets.js'
import { useAudio } from './useAudio.js'
import { useSettings } from './useSettings.js'
import { useToast } from './useToast.js'
import { parseImportPayload, cloneConfig } from '../utils/presetFormat.js'
import { backupFileName } from '../utils/backup.js'

export function useActions() {
  const router = useRouter()
  const workout = useWorkout()
  const presets = usePresets()
  const audio = useAudio(useSettings().settings)
  const { toast } = useToast()
  // 训练开始前所在的页面路径，结束后返回
  let returnTo = '/'

  function resolvePreset(key) {
    return presets.loadBuiltin(key) || presets.customPresets[key] || null
  }

  const actions = {
    startPreset(key) {
      const p = resolvePreset(key)
      if (!p) return
      audio.prime()
      returnTo = router.currentRoute.value.fullPath
      const ok = workout.startWorkout(audio, p)
      if (!ok) toast('训练内容为空')
    },
    startConfig(cfg) {
      audio.prime()
      returnTo = router.currentRoute.value.fullPath
      const ok = workout.startWorkout(audio, cfg)
      if (!ok) toast('训练内容为空')
      return ok
    },
    pause() {
      workout.togglePause()
      if (workout.paused.value) audio.cancel()
    },
    skip() {
      workout.skip()
    },
    stopWorkout() {
      workout.stop()
      audio.cancel()
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
      router.push(returnTo || '/')
    },
    restart() {
      audio.prime()
      const ok = workout.startWorkout(audio)
      if (!ok) toast('训练内容为空')
    },
    home() {
      workout.goHome()
      audio.cancel()
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
      router.push('/')
    },
    savePreset(name, config, key) {
      const k = presets.savePreset(name, config, key)
      toast(key ? '已更新「' + name + '」' : '已保存「' + name + '」')
      router.push('/preset/custom/' + k)
      return k
    },
    deletePreset(key) {
      const name = presets.customPresets[key]?.name || '未命名'
      presets.deletePreset(key)
      toast('已删除「' + name + '」')
    },
    /** 立即复制为新的自定义预设（不进编辑页） */
    forkPreset(key, name) {
      const p = resolvePreset(key)
      if (!p) return null
      const cfg = cloneConfig(p)
      const n = String(name || '').trim() || (p.name || '预设') + ' 副本'
      cfg.name = n
      const k = presets.savePreset(n, cfg)
      toast('已另存为「' + n + '」')
      router.push('/preset/custom/' + k)
      return k
    },
    importPreset(raw) {
      const result = parseImportPayload(raw)
      if (!result.ok) return result
      return { ok: true, data: result.data }
    },
    exportPreset(name = '', data = null) {
      if (!data) {
        toast('没有可导出的内容')
        return
      }
      const payload = {
        v: 1,
        name: name || data.name || '',
        exercises: (data.exercises || []).map((e) => ({
          name: e.name,
          work: e.work,
          rest: e.rest,
        })),
        rounds: data.rounds,
        restBetweenRounds: data.restBetweenRounds,
        warmupEnabled: data.warmupEnabled,
        warmupSeconds: data.warmupSeconds,
        icon: data.icon || undefined,
        exportedAt: new Date().toISOString(),
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const base = String(name || data.name || '')
        .trim()
        .replace(/[\\/:*?"<>|]/g, '-') || '预设'
      a.download = base + '.json'
      a.click()
      URL.revokeObjectURL(url)
      toast('已导出「' + (payload.name || base) + '」')
    },
    exportAllPresets() {
      const presetsMap = presets.customPresets
      const keys = Object.keys(presetsMap)
      if (!keys.length) {
        toast('暂无自定义预设')
        return
      }
      const backup = {
        v: 1,
        type: 'ct3-backup',
        exportedAt: new Date().toISOString(),
        presets: JSON.parse(JSON.stringify(presetsMap)),
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupFileName()
    a.click()
    URL.revokeObjectURL(url)
    toast('已保存备份（' + keys.length + ' 个预设）')
    },
    /** 合并导入备份，同名 key 覆盖。返回 { ok, count } 或 { ok: false, error }。 */
    importAllPresets(raw) {
      if (!raw || typeof raw !== 'object' || raw.type !== 'ct3-backup' || !raw.presets || typeof raw.presets !== 'object') {
        return { ok: false, error: '不是有效的备份文件' }
      }
      let count = 0
      for (const [key, p] of Object.entries(raw.presets)) {
        if (p && typeof p === 'object') {
          const saved = presets.savePreset(p.name || '未命名', p, key)
          if (saved) count++
        }
      }
      return count ? { ok: true, count } : { ok: false, error: '备份文件中没有有效预设' }
    },
  }

  return actions
}
