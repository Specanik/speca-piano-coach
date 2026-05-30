import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..', '..')

/**
 * Loads a vanilla IIFE JS file and returns the module's exported global.
 * The file must end with `return <GlobalName>;` or we append it ourselves.
 *
 * Usage: const ChordsDB = loadIife('js/chords.js', 'ChordsDB')
 */
export function loadIife(relativePath, globalName) {
  const code = readFileSync(join(rootDir, relativePath), 'utf-8')
  // eslint-disable-next-line no-new-func
  return new Function(code + `\nreturn ${globalName};`)()
}
