import { readdir, readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../dist/', import.meta.url)
const prohibited = /codex|claude/i
const files = []
async function walk(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name
    assert.ok(!prohibited.test(name), `Unexpected production filename: ${name}`)
    assert.ok(
      !/(^|\/)(?:artifacts|scripts|tests|node_modules|\.agents|\.git)(\/|$)|\.map$/i.test(name),
      `Development artifact deployed: ${name}`,
    )
    const url = new URL(entry.name, directory)
    if (entry.isDirectory()) await walk(new URL(url.href + '/'), name + '/')
    else {
      files.push(name)
      assert.ok(
        !prohibited.test((await readFile(url)).toString('latin1')),
        `Unintended assistant reference in ${name}`,
      )
    }
  }
}
await walk(root)
console.log(
  `Production audit passed: ${files.length} files; no assistant references, source maps, or development directories.`,
)
console.log(files.sort().join('\n'))
