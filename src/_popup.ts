import { sendToActiveTab } from './helpers.js'

import type { Destination, DestinationName, Message } from './messageTypes.js'

type DestinationTranslation = Record<DestinationName, string>

const translations = {
	'accessibility-statement': '♿ Accessibility statement',
	'change-password': '🔑 Change password',
	'contact': '☎️  Contact',
	'help': '❓ Help',
	'home': '🏡 Home',
	'log-in': '🔓 Log in',
	'products': '🛒 Products',
	'search': '🔎 Search'
} as const satisfies DestinationTranslation

chrome.runtime.onMessage.addListener((message: Message) => {
	switch (message.name) {
		case 'page-name':
			document.getElementById('page-name').innerText = message.data
			break
		case 'head-destinations':
		case 'body-destinations':
			updateDestinations(message.name, message.data)
			break
		case 'popup-open':
			// In Firefox, the pop-up may remain open when moving between tabs.
			sendToActiveTab({ name: 'popup-open', data: true })
			break
		default:
			console.log(`ia: popup: got unknown message '${message.name}': ${message}`)
	}
})

function updateDestinations(kind: 'head-destinations' | 'body-destinations', destinations: Destination[]) {
	if (kind === 'body-destinations') return
	const group = document.getElementById(kind)
	const newDestinations = []
	for (const [ name, url ] of destinations) {
		const btn = document.createElement('button')
		btn.append(translations[name])
		btn.addEventListener('click', () => {
			sendToActiveTab({ name: 'go-to', data: url })
		})
		newDestinations.push(btn)
	}
	group.replaceChildren(...newDestinations)
	// TODO: set hidden on desc
}

document.addEventListener('DOMContentLoaded', function() {
	sendToActiveTab({ name: 'popup-open', data: true })
})
