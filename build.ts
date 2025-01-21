import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import * as esbuild from 'esbuild'
import dircompare from 'dir-compare'

const requireJson = (path: string) =>
	JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf-8'))

function isUpToDate(src: string | string[], dest: string) {
	const process = Array.isArray(src) ? src : [ src ]

	if (!fs.existsSync(dest)) return false
	
	for (const source of process) {
		const res = dircompare.compareSync(source, dest, { compareDates: true })
		if (res.diffSet) {
			for (const item of res.diffSet) {
				if (item.date1 && item.date2 && item.date1 > item.date2) return false
			}
		}
	}
	
	return true
}

function doAndReport(src: string | string[], dest: string, action: () => void, quiet = false) {
	if (isUpToDate(src, dest)) {
		console.log(`${dest} is up to date`)
	} else {
		if (!quiet) console.log(`${src} -> ${dest}...`)
		action()
	}
}

function buildManifest(src: string, dest: string, extensionVersion: string) {
	doAndReport(src, dest, () => {
		const manifestJson = requireJson(src)
		manifestJson.version = extensionVersion
		fs.writeFileSync(dest, JSON.stringify(manifestJson, null, 2), 'utf-8')
	})
}

function buildSourceFile(src: string, dest: string) {
	console.log(`${src} -> ${dest}...`)
	esbuild.buildSync({
		entryPoints: [ src ],
		bundle: true,
		minify: false,
		sourcemap: false,
		target: [ 'es2021' ],
		outfile: dest
	})
}

function generateElementsThatExistTypes(sources: string[], htmlFile: string, dest: string) {
	function core() {
		const html = fs.readFileSync(htmlFile, 'utf-8')
		let code = '// AUTO-GENERATED FILE\n\n'
		const generalIds = []

		for (const match of html.matchAll(/<[^>]+? .*?id=.(.+?)["']/g)) {
			generalIds.push(`'${match[1]}'`)
		}

		code += 'type ExistingGeneralElements = ' + generalIds.join(' | ') + '\n\n'
		code += 'interface Document {\n'
		code += '\tgetElementById(id: ExistingGeneralElements): HTMLElement\n'
		code += '}\n'

		fs.writeFileSync(dest, code)
		console.log(`${dest} written`)
	}
	
	if (fs.existsSync(dest)) {
		doAndReport(sources, dest, core, true)
	} else {
		console.log(`Generating ${dest}...`)
		core()
	}
}


//
// Main
//

const BUILD_DIR = 'build'
const STATIC_DIR = 'static'
const SRC_DIR = 'src'
const HTML_IN = path.join(STATIC_DIR, 'popup.html')
const VALID_ID_TYPES_OUT = 'popup.valid-ids.d.ts'
const THIS_SCRIPT = fileURLToPath(import.meta.url)
const extensionVersion = requireJson('package.json').version
const buildItems = [
	[ `${SRC_DIR}/_content.ts`, `${BUILD_DIR}/content.js` ],
	[ `${SRC_DIR}/_background.ts`, `${BUILD_DIR}/background.js` ],
	[ `${SRC_DIR}/_popup.ts`, `${BUILD_DIR}/popup.js` ]
]

generateElementsThatExistTypes([ THIS_SCRIPT, HTML_IN ], HTML_IN, VALID_ID_TYPES_OUT)


if (!fs.existsSync(BUILD_DIR)) {
	console.log(`Making directory: ${BUILD_DIR}`)
	fs.mkdirSync(BUILD_DIR)
}

console.log(`Building v${extensionVersion}...`)

const allSourceFiles = fs.readdirSync(SRC_DIR).map(
	(file: string) => path.join(SRC_DIR, file))

for (const [ src, dest ] of buildItems) {
	doAndReport(allSourceFiles, dest, () => buildSourceFile(src, dest), true)
}

const statics = fs.readdirSync(STATIC_DIR)

const staticPairs = statics
	.filter((file: string) =>
		!file.startsWith('.') && file !== 'manifest.json')
	.map((file: string) =>
		[ path.join(STATIC_DIR, file), path.join(BUILD_DIR, file) ])

buildManifest('static/manifest.json', 'build/manifest.json', extensionVersion)

for (const [ src, dest ] of staticPairs) {
	doAndReport(src, dest, () => fs.copyFileSync(src, dest))
}
