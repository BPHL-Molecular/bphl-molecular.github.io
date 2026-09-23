import { copyFile, mkdir, writeFile } from 'node:fs/promises'

// Pages serves files directly, so each public route needs its own entry point.
const output = new URL('../dist/', import.meta.url)
const entry = new URL('index.html', output)
for (const route of ['team', 'training', 'pipelines']) {
  const directory = new URL(`${route}/`, output)
  await mkdir(directory, { recursive: true })
  await copyFile(entry, new URL('index.html', directory))
}
await copyFile(entry, new URL('404.html', output))
await writeFile(new URL('.nojekyll', output), '')
