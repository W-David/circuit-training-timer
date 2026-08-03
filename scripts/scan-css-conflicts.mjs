import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { __unstable__loadDesignSystem } from 'tailwindcss'

const require = createRequire(import.meta.url)
const root = process.cwd()
const apply = process.argv.includes('--apply')

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

function escapeClass(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`)
}

function signature(astNodes, className) {
  const needle = `.${escapeClass(className)}`
  const entries = []
  function walkNodes(nodes, path) {
    for (const node of nodes ?? []) {
      if (node.kind !== 'rule' && node.kind !== 'at-rule') continue
      const props = (node.nodes ?? [])
        .filter((n) => n.kind === 'declaration')
        .map((n) => n.property)
      const nextPath = [...path, node]
      if (props.length > 0) {
        entries.push({
          properties: [...props].sort(),
          context: nextPath
            .map((h) =>
              h.kind === 'rule'
                ? h.selector.replaceAll(needle, '&')
                : `${h.name} ${h.params}`,
            )
            .filter((x) => x !== '' && x !== '&'),
        })
      }
      walkNodes(node.nodes, nextPath)
    }
  }
  walkNodes(astNodes, [])
  return JSON.stringify(entries)
}

const attrRe = /(?:^|\s)(:class|class)\s*=\s*"([^"]*)"/g
let totalConflicts = 0

for (const file of await walk(join(root, 'src'))) {
  const text = await readFile(file, 'utf8')
  const edits = []
  for (const m of text.matchAll(attrRe)) {
    const attrStart = m.index + m[0].indexOf('=')
    const valueStart = m.index + m[0].indexOf('"') + 1
    const isBinding = m[1] === ':class'
    const value = m[2]

    const lists = []
    if (isBinding) {
      const quoteRe = /'([^']*)'|"([^"]*)"/g
      for (const q of value.matchAll(quoteRe)) {
        lists.push({ list: q[1] ?? q[2], start: valueStart + q.index + 1, raw: q[0] })
      }
    } else {
      lists.push({ list: value, start: valueStart, raw: `"${value}"` })
    }

    for (const { list, start, raw } of lists) {
      const tokens = list.split(/\s+/).filter(Boolean)
      if (tokens.length === 0) continue
      const sigs = ds.candidatesToAst(tokens).map((ast, i) => ({
        token: tokens[i],
        sig: ast ? signature(ast, tokens[i]) : 'null',
      }))
      const bySig = new Map()
      sigs.forEach((s, i) => {
        const arr = bySig.get(s.sig) ?? []
        arr.push({ token: s.token, index: i })
        bySig.set(s.sig, arr)
      })

      const drop = new Set()
      const stripBang = new Set()
      let localConflicts = 0
      for (const group of bySig.values()) {
        if (group.length < 2) continue
        const winner = group[group.length - 1]
        const losers = group.slice(0, -1)
        localConflicts += losers.length
        for (const l of losers) drop.add(l.index)
        if (winner.token.endsWith('!')) stripBang.add(winner.index)
      }
      totalConflicts += localConflicts

      const line = text.slice(0, start).split('\n').length
      if (localConflicts > 0 && !apply) {
        for (const g of bySig.values()) {
          if (g.length < 2) continue
          const winners = g.map((x) => x.token)
          console.log(
            `${file}:${line}  ${winners.slice(0, -1).map((t) => `\`${t}\``).join(' + ')} -> 保留 \`${winners[winners.length - 1]}\``,
          )
        }
      }

      if (apply && localConflicts > 0) {
        const leading = list.match(/^\s*/)[0]
        const trailing = list.match(/\s*$/)[0]
        const kept = tokens
          .map((t, i) => (drop.has(i) ? null : stripBang.has(i) ? t.slice(0, -1) : t))
          .filter(Boolean)
        const newList = leading + kept.join(' ') + trailing
        if (newList !== list) edits.push({ start, end: start + list.length, newText: newList })
      }
    }
    void attrStart
  }

  if (apply && edits.length > 0) {
    let out = text
    for (const e of edits.sort((a, b) => b.start - a.start)) {
      out = out.slice(0, e.start) + e.newText + out.slice(e.end)
    }
    await import('node:fs/promises').then((fs) => fs.writeFile(file, out))
  }
}

console.log(`\n${totalConflicts} 处 cssConflict 待处理${apply ? '（已应用）' : ''}`)
