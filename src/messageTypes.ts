const DESTINATIONS = [
	'accessibility-statement',
	'change-password',
	'contact',
	'help',  // FIXME: this is already a taken @rel value
	'home',
	'products',
	'log-in',
	'search'
] as const

export type DestinationName = typeof DESTINATIONS[number]

export type Destination = [DestinationName, URL]

export function isDestination(candidate: string): candidate is DestinationName {
	return DESTINATIONS.includes(candidate as DestinationName)
}

// FIXME: There are no more messages with optional data.
export type Message =
	{ name: 'clear-badge' } |
	{ name: 'popup-open', data?: boolean } |
	{ name: 'page-name', data: string } |
	{ name: 'head-destinations', data: Destination[] } |
	{ name: 'body-destinations', data: Destination[] } |
	{ name: 'go-to', data: URL }

export type MessageName<M = Message> =
	M extends { name: string }
		? M extends { data?: unknown } ? M['name'] : never
		: never

export type MessageType<Name extends Message['name'], M = Message> =
	M extends { name: Name, data?: unknown } ? M['data'] : never
