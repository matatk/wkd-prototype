import { isDestination } from './messageTypes.js'

import type { Destination, Message, MessageName, MessageType } from './messageTypes.js'

let gPort: chrome.runtime.Port
let gPopupOpen = false
const gHeadDestinations: Destination[] = []
const gBodyDestinations: Destination[] = []

// Event handlers
// {{{

// NOTE: We don't check for undefined data in the *-destinations messages, as
//       only this script will send those messages _with_ data.
function portMessageHandler(message: Message) {
	if (!message.name) return
	switch (message.name) {
		case 'body-destinations':
			console.log('ia: content: got from port: page-destinations')
			getBodyDestinations()
			badgeFoundDestinations()
			break
	}
}

function runtimeMessageHandler(message: Message) {
	console.log('ia: content: got', message)
	if (!message.name) return
	switch (message.name) {
		case 'popup-open':
			if (message.data !== undefined) {
				gPopupOpen = message.data
				sendInfo()
			}
			break
		case 'go-to':
			location.assign(message.data)
	}
}

function visibilityHandler() {
	// NOTE: We have not been listening to messages (including the one about
	//       the popup's visibility) whilst invisible, so we ask the background
	//       script to update us.
	if (!gPort) {
		gPort = chrome.runtime.connect({ name: 'content' })
	}
	if (document.hidden) {
		gPort.onMessage.removeListener(portMessageHandler)
		chrome.runtime.onMessage.removeListener(runtimeMessageHandler)
		gPort.postMessage({ name: 'clear-badge' })
	} else {
		gPort.onMessage.addListener(portMessageHandler)
		chrome.runtime.onMessage.addListener(runtimeMessageHandler)
		badgeFoundDestinations()

		// In Firefox, the pop-up can be open as we move between tabs.
		// In Chrome (and Firefox? FIXME), the pop-up remains open when we remain on the same page.
		chrome.runtime.sendMessage({ name: 'popup-open' }, () => {
			if (chrome.runtime.lastError) {
				// noop
			}
		})
	}
}

// }}}

// Data processing
// {{{

function getHeadDestinations() {
	getDestinations('head', document.head.getElementsByTagName('link'), gHeadDestinations)
}

// FIXME: conflict with meaning of help
// FIXME: even the help link deep-links, right?
function getBodyDestinations() {
	getDestinations('body', document.querySelectorAll('body a[rel]'), gBodyDestinations)
}

function getDestinations(kindName: string, elements: HTMLCollectionOf<HTMLLinkElement> | NodeListOf<HTMLAnchorElement>, store: Destination[]) {
	store.length = 0
	for (const el of elements) {
		for (const rel of el.getAttribute('rel')?.split(/\s+/) ?? []) {
			if (isDestination(rel)) {
				store.push([ rel, new URL(el.href) ])
			}
		}
	}
	console.log(`ia: content: ${kindName} destinations:`, store)
}

function badgeFoundDestinations() {
	gPort.postMessage({
		name: 'set-badge',
		data: gHeadDestinations.length + gBodyDestinations.length
	})
}

function truncate(text: string): string {
	const maxlength = 30
	return (text.length > maxlength)
		? text.slice(0, maxlength - 1) + '…'
		: text
}

// }}}

// Messaging
// {{{

function sendInfo() {
	console.log('ia: send(): popup open?', gPopupOpen)
	if (!gPopupOpen) return
	send('page-name', truncate(document.title))
	send('head-destinations', gHeadDestinations)
	send('body-destinations', gBodyDestinations)
}

// NOTE: Callers need to check document is visible, and whether popup is open
function send<Name extends MessageName>(name: Name, data: MessageType<Name>): void {
	chrome.runtime.sendMessage({ name, data })
}

// }}}

// Start-up
// {{{

function main() {
	console.log('ia: content: starting up')
	getHeadDestinations()
	getBodyDestinations()

	document.addEventListener('visibilitychange', visibilityHandler)

	// Firefox auto-injects content scripts to existing tabs
	if (!document.hidden) {
		visibilityHandler()
		sendInfo()
	}
}

main()

// }}}
