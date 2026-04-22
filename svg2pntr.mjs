#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import svgToPntr from './index.js'

const args = process.argv.slice(2)
if (args.length < 1) {
  console.error('Usage: svg2pntr <input.svg> [output.h]')
  console.error('       Omit output.h to write to stdout.')
  process.exit(1)
}

const [inputFile, outputFile] = args

let svgContent
try {
  svgContent = await readFile(inputFile, 'utf8')
} catch (e) {
  console.error(`Cannot read ${inputFile}: ${e.message}`)
  process.exit(1)
}

const name = basename(inputFile, extname(inputFile)).replace(/[^a-zA-Z0-9_]/g, '_')
const result = svgToPntr(svgContent, `draw_${name}`)

if (outputFile) {
  await writeFile(outputFile, result)
  console.error(`Wrote ${outputFile}`)
} else {
  process.stdout.write(result)
}
