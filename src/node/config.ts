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
	NFT: {
		ROYALTY: getRangeConfig(0, 99),
		SHARE: getRangeConfig(0, 100),
		ADDRESS_IN_MINTER_WHITELIST: getRangeConfig(0, 20),
		SIGNERS_IN_SIGNERS: getRangeConfig(0, 10),
		HASH: getRangeConfig(1, 1024),
		URI: getRangeConfig(1, 1000),
	},
	CREDENTIAL: {
		ID: getRangeConfig(1, 20),
		VALUE: getRangeConfig(1, 1024),
		TEMPLATE_ID: getRangeConfig(1, 20),
		TEMPLATE_NAME: getRangeConfig(1, 20),
		DISPLAY_NAME: getRangeConfig(1, 20),
		SUBJECT_KEY: getRangeConfig(1, 20),
		DESCRIPTION: getRangeConfig(1, 1024),
	},
	TIMESTAMP: {
		PROJECT_ID: getRangeConfig(1, 10),
		DATA: getRangeConfig(1, 1024),
	},
	STO: {
		PARTITION: getRangeConfig(3, 10),
	},
	DAO: {
		ADDRESS_IN_WHITELIST: getRangeConfig(0, 10),
		QUORUM: getRangeConfig(1, 100),
		VOTE: getRangeConfig(0, 255),
	},
	STORAGE: {
		PROJECT: getRangeConfig(1, 10),
		DATA_KEY: getRangeConfig(1, 200),
		DATA_VALUE: getRangeConfig(1, 20000)
	}
}