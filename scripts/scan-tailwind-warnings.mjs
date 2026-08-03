import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { __unstable__loadDesignSystem } from 'tailwindcss'

const require = createRequire(import.meta.url)
const root = process.cwd()

async function loadStylesheet(id, base) {
  if (id.startsWith('tailwindcss/')) {
    const path = require.resolve(id)
    return { path, base: dirname(path), content: await readFile(path, 'utf8') }
  }
  if (id.startsWith('.')) {
    const path = resolve(base, id)
    return { path, base: dirname(path), content: await readFile(path, 'utf8') }
  }
  throw new Error(`Cannot resolve stylesheet: ${id}`)
}

const mainCss = await readFile(join(root, 'src/styles/main.css'), 'utf8')
const ds = await __unstable__loadDesignSystem(mainCss, {
  base: join(root, 'src/styles'),
  loadStylesheet,
})

async function walk(dir) {
  const out = []
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue
      out.push(...(await walk(p)))
    } else if (/\.(vue|js)$/.test(ent.name)) {
      out.push(p)
    }
  }
  return out
}

const hits = new Map() // `${file}:${line}:${original}` -> { file, line, original, canon }

for (const file of await walk(join(root, 'src'))) {
  const text = await readFile(file, 'utf8')
  const attrRe = /(?:^|\s)(:class|class)\s*=\s*"([^"]*)"/g
  for (const m of text.matchAll(attrRe)) {
    const offset = m.index
    const line = text.slice(0, offset).split('\n').length
    const isBinding = m[1] === ':class'
    const raw = m[2]
    const lists = isBinding ? [...raw.matchAll(/'([^']*)'|"([^"]*)"/g)].map((x) => x[1] ?? x[2]) : [raw]
    for (const list of lists) for (const token of list.split(/\s+/)) {
      if (!token) continue
      const [canon] = ds.canonicalizeCandidates([token], { rem: 16 })
      if (canon && canon !== token) hits.set(`${file}:${line}:${token}`, { file, line, original: token, canon })
    }
  }
}

for (const [, { file, line, original, canon }] of [...hits.entries()].sort((a, b) =>
  a[1].file.localeCompare(b[1].file) || a[1].line - b[1].line,
)) {
  console.log(`${file}:${line}\t\`${original}\` -> \`${canon}\``)
}
