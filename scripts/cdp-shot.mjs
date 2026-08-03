#!/usr/bin/env node
/**
 * 零依赖 CDP 截图工具：启动无头 Chrome，驱动页面交互后截图。
 * 用于验证计时器/总结页等无法通过静态 URL 直接截图的视图。
 *
 * 用法：node scripts/cdp-shot.mjs <out.png> <url> ["js 表达式"]
 *   js 表达式（可选）：在页面加载后执行，返回值会被打印。
 */
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const [out, url, expr] = process.argv.slice(2)

const profile = mkdtempSync(join(tmpdir(), 'ct3-cdp-'))
const port = 9333
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=430,932',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function getJson(path) {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}${path}`)
      if (res.ok) return res.json()
    } catch {}
    await sleep(200)
  }
  throw new Error('Chrome 调试端口未就绪')
}

let msgId = 0
const pending = new Map()

function cdp(ws, method, params = {}) {
  const id = ++msgId
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

async function main() {
  const tab = await getJson(`/json/new?${encodeURIComponent(url)}`)
  const ws = new WebSocket(tab.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    }
  }

  await cdp(ws, 'Page.enable')
  await cdp(ws, 'Runtime.enable')
  await cdp(ws, 'Page.navigate', { url })
  await sleep(3500)

  if (expr) {
    const r = await cdp(ws, 'Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
    })
    console.log('EVAL:', JSON.stringify(r.result?.value))
  }

  const shot = await cdp(ws, 'Page.captureScreenshot', { format: 'png' })
  writeFileSync(out, Buffer.from(shot.data, 'base64'))
  console.log('SHOT:', out)
  ws.close()
}

main()
  .catch((e) => {
    console.error('ERR:', e.message)
    process.exitCode = 1
  })
  .finally(() => {
    chrome.kill()
    spawnSync('rm', ['-rf', profile])
  })
