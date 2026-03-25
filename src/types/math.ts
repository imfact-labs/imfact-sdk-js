import Int64 from "int64-buffer"
import bigInt from "big-integer"
import { IBytes, IString } from "../types"
import { Assert, ECODE, MitumError } from "../error"

export class Big implements IBytes, IString {
	readonly big: bigint

	constructor(big: string | number | bigint | Uint8Array | Big) {
		if (big instanceof Big) {
			this.big = big.big
			return
		}

		switch (typeof big) {
			case "number":
			case "string":
			case "bigint":
				this.big = BigInt(big)
				break

		case "object":
			if (big instanceof Uint8Array) {
			this.big = this.bytesToBig(big)
			} else {
				throw MitumError.detail(ECODE.INVALID_BIG_INTEGER, "wrong big")
			}
			break

		default:
			throw MitumError.detail(ECODE.INVALID_BIG_INTEGER, "wrong big")
		}
	}

	static from(big: string | number | bigint | Uint8Array | Big) {
		return big instanceof Big ? big : new Big(big)
	}

	private bytesToBig(bytes: Uint8Array): bigint {
		let hex = ""
		for (const b of bytes) {
			hex += b.toString(16).padStart(2, "0")
		}
		return BigInt("0x" + hex)
	}

	toBytes(option?: "fill"): Uint8Array {
		const size = this.byteLen()

		if (option === "fill") {
			Assert.check(
				size <= 8,
				MitumError.detail(ECODE.INVALID_BIG_INTEGER, "big out of range")
			)

			return new Uint8Array(
				new Int64.Uint64BE(this.toString()).toBuffer()
			)
		}

		const buf = new Uint8Array(size)

		let n = bigInt(this.big)
		for (let i = size - 1; i >= 0; i--) {
			buf[i] = n.mod(256).valueOf()
			n = n.divide(256)
		}

		return buf
	}

  	byteLen(): number {
		const bitLen = bigInt(this.big).bitLength()
		const quotient = bigInt(bitLen).divide(8)

		if (bitLen.valueOf() - quotient.valueOf() * 8 > 0) {
			return quotient.valueOf() + 1
		}

		return quotient.valueOf()
  	}

	get v(): number {
		if (this.big <= BigInt(Number.MAX_SAFE_INTEGER)) {
			return parseInt(this.toString())
		}
		return -1
	}

	toString(): string {
		return this.big.toString()
	}

	overZero(): boolean {
		return this.big > 0
	}

	compare(n: string | number | Big) {
		n = Big.from(n)
		if (this.big < n.big) {
			return -1
		} else if (this.big > n.big) {
			return 1
		}
		return 0
	}
}

export class Float implements IBytes, IString {
	readonly n: number

	constructor(n: number) {
		this.n = n
	}

	static from(n: number | Float) {
		return n instanceof Float ? n : new Float(n)
	}

	toBytes(): Uint8Array {
		const buffer = new ArrayBuffer(8)
		const view = new DataView(buffer)
		view.setFloat64(0, this.n, false) // big-endian

		return new Uint8Array(buffer)
	}

	toString(): string {
		return "" + this.n
	}
}

export class Uint8 implements IBytes, IString {
	readonly n: number

	constructor(n: number) {
		Assert.check(
			0 <= n && n <= 255,
			MitumError.detail(ECODE.INVALID_UINT8, "uint8 out of range")
		)
		this.n = n
	}

	static from(n: number | Uint8) {
		return n instanceof Uint8 ? n : new Uint8(n)
	}

	toBytes(): Uint8Array {
		return new Uint8Array([this.n])
	}

	get v(): number {
		return this.n
	}

	toString(): string {
		return this.n.toString()
	}
}

export class Bool implements IBytes, IString {
	private b: boolean

	constructor(b: boolean) {
		this.b = b
	}

	static from(b: boolean | Bool) {
		return b instanceof Bool ? b : new Bool(b)
	}

	toBytes(): Uint8Array {
		return new Uint8Array([this.b ? 1 : 0])
  	}
  	
	get v(): boolean {
		return this.b
	}
}