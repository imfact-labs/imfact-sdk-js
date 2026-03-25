import { IBytes, IString } from "./interface"
import { Assert, MitumError } from "../error"

export class TimeStamp implements IBytes, IString {
	private t: Date

	constructor(t?: string | number | Date) {
		if (t === undefined) {
			this.t = new Date()
		} else {
			this.t = new Date(t)
		}
	}

	static new() {
		return new TimeStamp()
	}

	static from(t?: string | number | Date | TimeStamp) {
		if (!t) {
			return this.new()
		}

		return t instanceof TimeStamp ? t : new TimeStamp(t)
	}

	toBytes(): Uint8Array {
		return new TextEncoder().encode(this.UTC())
	}

	toString(): string {
		return this.ISO()
	}

	ISO(): string {
		return this.t.toISOString()
	}

	UTC(): string {
		const iso = this.t.toISOString()
		const t = iso.indexOf("T")

		let z = iso.indexOf("Z")
		let rtime

		if (z < 0) {
			z = iso.indexOf("+")
		}

		Assert.check(0 <= z, MitumError.detail(undefined, "no 'Z' in iso"))

		let _time = iso.substring(t + 1, z)

		const dotIdx = _time.indexOf(".")
		if (dotIdx < 0) {
			rtime = _time
		} else {
			const decimal = _time.substring(9, _time.length)
			const idx = decimal.lastIndexOf("0")
			if (idx < 0 || idx != decimal.length - 1) {
				rtime = _time
			} else {
				let startIdx = decimal.length - 1
				for (let i = decimal.length - 1; i > -1; i--) {
					if (decimal[i] == "0") {
						startIdx = i
					} else {
						break
					}
				}

				if (startIdx == 0) {
					rtime = _time.substring(0, dotIdx)
				} else {
					rtime =
						_time.substring(0, dotIdx) +
						"." +
						decimal.substring(0, startIdx)
				}
			}
		}

		return iso.substring(0, t) + " " + rtime + " +0000 UTC"
	}
}

export class FullTimeStamp extends TimeStamp {
	private r: string

	constructor(s: string) {
		super(s)

		const dot = s.indexOf(".")
		if (dot < 0) {
			this.r = ""
		} else {
			this.r = s.substring(dot, s.length)
		}
	}

	static from(t: string | FullTimeStamp) {
		return t instanceof FullTimeStamp ? t : new FullTimeStamp(t)
	}

	toBytes(option?: "super"): Uint8Array {
		return new TextEncoder().encode(option === "super" ? super.UTC() : this.UTC())
	}

	ISO(): string {
		const iso = super.ISO()
		if (this.r) {
			const idx = iso.indexOf(".")
			return iso.substring(0, idx) + this.r
		}
		return iso
	}

	UTC(): string {
		const utc = super.UTC()
		if (this.r) {
			const idx0 = utc.indexOf(".")
			const idx1 = utc.indexOf("+")
			return utc.substring(0, idx0) + this.r + " " + utc.substring(idx1)
		}
		return utc
	}
}