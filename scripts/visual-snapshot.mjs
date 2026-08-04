#!/usr/bin/env node
/**
 * Tailwind 迁移的可视化回归工具（零依赖）。
 *
 * 用法：
 *   node scripts/visual-snapshot.mjs before   # 迁移前基线（.visual/before）
 *   node scripts/visual-snapshot.mjs after    # 迁移后快照（.visual/after）
 *   node scripts/visual-snapshot.mjs diff     # 像素对比（.visual/diff，非零退出码表示有差异）
 *
 * 环境变量：
 *   VISUAL_BASE     目标地址，默认 http://localhost:5173
 *   VISUAL_THRESHOLD 允许差异像素数，默认 0
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, basename } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.env.VISUAL_BASE || 'http://localhost:5173'
const THRESHOLD = Number(process.env.VISUAL_THRESHOLD || 0)

const ROUTES = [
  ['home', '/'],
  ['detail', '/#/preset/builtin/全身力量'],
  ['edit', '/#/new'],
  ['timer', '/?demo=timer'],
  ['timer-work', '/?demo=work'],
  ['summary', '/?demo=summary'],
  ['notfound', '/404.html'],
]
const SIZES = [
  ['mobile', 430, 932],
  ['desktop', 1280, 900],
]

// 调试用：只拍单页单尺寸，如 VISUAL_ONLY=edit-mobile / timer-work-mobile
const ONLY = process.env.VISUAL_ONLY
const ONLY_ROUTE = ONLY ? ONLY.slice(0, ONLY.lastIndexOf('-')) : null
const ONLY_SIZE = ONLY ? ONLY.slice(ONLY.lastIndexOf('-') + 1) : null

function shotPath(dir, route, size) {
  return join(ROOT, dir, `${route}-${size}.png`)
}

function chromeShot(url, out, width, height) {
  const profile = join(tmpdir(), `ct3-visual-${Date.now()}`)
  mkdirSync(profile, { recursive: true })
  const res = spawnSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${width},${height}`,
      '--virtual-time-budget=3000',
      `--user-data-dir=${profile}`,
      `--screenshot=${out}`,
      url,
    ],
    { stdio: 'pipe', timeout: 60_000 },
  )
  rmSync(profile, { recursive: true, force: true })
  if (res.status !== 0) {
    const msg = (res.stderr || res.stdout || '').toString().trim()
    console.error(`[chrome] ${msg}`)
    return false
  }
  return existsSync(out)
}

function capture(dir) {
  mkdirSync(join(ROOT, dir), { recursive: true })
  let failed = 0
  for (const [route, path] of ROUTES) {
    if (ONLY && route !== ONLY_ROUTE) continue
    for (const [size, w, h] of SIZES) {
      if (ONLY && size !== ONLY_SIZE) continue
      const out = shotPath(dir, route, size)
      console.log(`capture ${dir}/${route}-${size}.png`)
      if (!chromeShot(`${BASE}${path}`, out, w, h)) failed++
    }
  }
  return failed === 0
}

function diff() {
  const before = join(ROOT, '.visual/before')
  const after = join(ROOT, '.visual/after')
  if (!existsSync(before) || !existsSync(after)) {
    console.error('缺少 .visual/before 或 .visual/after，先运行 before/after 截图')
    process.exit(2)
  }
  const diffDir = join(ROOT, '.visual/diff')
  mkdirSync(diffDir, { recursive: true })
  let bad = 0
  for (const f of readdirSync(before).filter((n) => n.endsWith('.png'))) {
    const a = join(before, f)
    const b = join(after, f)
    if (!existsSync(b)) {
      console.error(`缺少 after 截图: ${f}`)
      bad++
      continue
    }
    const out = join(diffDir, f)
    const res = spawnSync('compare', ['-metric', 'AE', a, b, out], {
      stdio: 'pipe',
    })
    const raw = String(res.stderr || '').trim()
    const ae = raw ? Number((raw.match(/[\d.e+-]+/) || [])[0]) : NaN
    const ok = Number.isFinite(ae) && ae <= THRESHOLD
    console.log(
      `${ok ? 'OK ' : 'DIFF'} ${f}: ${Number.isFinite(ae) ? ae : '?'} px`,
    )
    if (!ok) bad++
  }
  console.log(bad ? `有 ${bad} 个截图存在差异` : '全部截图像素一致')
  return bad === 0
}

const mode = process.argv[2]
if (mode === 'before' || mode === 'after') {
  process.exit(capture(`.visual/${mode}`) ? 0 : 1)
} else if (mode === 'diff') {
  process.exit(diff() ? 0 : 1)
} else {
  console.error('用法: node scripts/visual-snapshot.mjs <before|after|diff>')
  process.exit(2)
}
