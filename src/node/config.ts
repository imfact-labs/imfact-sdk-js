export type Setting<T> = {
	get: () => T
	set: (val: T) => T
}

export const Version: Setting<string> = (() => {
	let v = "v0.0.1"
	return {
		get: () => v,
		set: (val: string) => {
			v = val
			return v
		}
	}
})()

export const NetworkID: Setting<string> = (() => {
	let v = "mitum"
	return {
		get: () => v,
		set: (val: string) => {
			v = val
			return v
		}
	}
})()

export type RangeConfig = {
	value?: number
	min: number
	max: number
	satisfy: (target: number) => boolean
}

const getRangeConfig = (min: number, max?: number): RangeConfig => {
	return {
		value: min == (max ?? min) ? min : undefined,
		min,
		max: max ?? min,
		satisfy: (target: number) => min <= target && target <= (max ?? min),
	}
}

export const Config = {
	SUFFIX: {
		DEFAULT: getRangeConfig(3),
		ZERO_ADDRESS: getRangeConfig(5)
	},
	CURRENCY_ID: getRangeConfig(3, 10),
	CONTRACT_ID: getRangeConfig(3, 10),
	SEED: getRangeConfig(36, Number.MAX_SAFE_INTEGER),
	THRESHOLD: getRangeConfig(1, 100),
	WEIGHT: getRangeConfig(1, 100),
	ADDRESS: {
		DEFAULT: getRangeConfig(45),
		ZERO: getRangeConfig(8, 15),
		NODE: getRangeConfig(4, Number.MAX_SAFE_INTEGER),
	},
	CONTRACT_HANDLERS: getRangeConfig(0, 20),
	CONTRACT_RECIPIENTS: getRangeConfig(0, 20),
	KEYS_IN_ACCOUNT: getRangeConfig(1, 100),
	AMOUNTS_IN_ITEM: getRangeConfig(1, 10),
	ITEMS_IN_FACT: getRangeConfig(1, 100),
	OP_SIZE: getRangeConfig(1, 262144),
	FACT_HASHES: getRangeConfig(1, 40),
	MSG_SIZE: getRangeConfig(1, 1024),
	KEY: {
		MITUM: {
			PRIVATE: getRangeConfig(67),
			PUBLIC: getRangeConfig(69),
		}
	},
	DMILE: {
		MERKLE_ROOT: getRangeConfig(64, 64),
	},
	DID: {
		PUBLIC_KEY: getRangeConfig(128, Number.MAX_SAFE_INTEGER),
	}
}