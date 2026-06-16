export type HintedObject = {
	_hint?: string,
	[i: string]: any
}

// A HintedObject whose shape is a serialized Fact: the core always stores
// _hint, token and hash as strings.
export type HintedFactObject = HintedObject & {
	_hint: string,
	token: string,
	hash: string,
}

// The `extension` block of a serialized UserOperation (account abstraction).
export type HintedExtensionObject = {
	authentication: HintedObject,
	proxy_payer?: HintedObject,
	settlement: HintedObject
}