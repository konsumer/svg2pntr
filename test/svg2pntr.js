import { describe, test } from 'node:test'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'

import svg2pntr from '../index.js'

describe('svg2pntr', () => {
	test('Convert tiger to pntr C code', async () => {
		const svg = await readFile(import.meta.dirname + '/tiger.svg', 'utf8')
		const out = svg2pntr(svg, 'tiger')
		console.log(out)
	})
})