// scripts/generateHandlers.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import yaml from 'yaml'
import glob from 'fast-glob'
import { fileURLToPath } from 'url'

// 🧠 __dirname workaround for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 🔧 Resolve paths relative to this script
const SERVICES_DIR = 'services'
const SRC_SERVICES_DIR = 'services\output'

// 📦 Find all .yaml files in services/
const files = await glob(`${SERVICES_DIR}\*.yaml`)

if (files.length === 0) {
  console.error(`${SERVICES_DIR}`)
  process.exit(1)
}

for (const file of files) {
  const content = readFileSync(file, 'utf8')
  const doc = yaml.parse(content)

  const vendor = path.basename(file, '.yaml')
  const paths = doc.paths || {}
  const operationIds = []

  for (const [route, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods)) {
      if (details.operationId) {
        operationIds.push(details.operationId)
      }
    }
  }

  const outDir = path.join(SRC_SERVICES_DIR, vendor)
  mkdirSync(outDir, { recursive: true })

  const outFile = path.join(outDir, 'index.js')
  const stub = operationIds.map(op =>
    `export async function ${op}(req, env, ctx) {\n  return new Response(JSON.stringify({ operation: "${op}", ok: true }))\n}\n`
  ).join('\n')

  writeFileSync(outFile, stub)
  console.log(`✔ Generated ${operationIds.length} handlers for ${vendor} → ${path.relative(__dirname, outFile)}`)
}
