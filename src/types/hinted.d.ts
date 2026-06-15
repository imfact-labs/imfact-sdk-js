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