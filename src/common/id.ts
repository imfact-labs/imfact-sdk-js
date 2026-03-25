import { Config } from "../node/config"
import type { IBytes, IString } from "../types"
import { Assert, ECODE, MitumError } from "../error"

const encoder = new TextEncoder();

abstract class ID implements IBytes, IString {
    private s: string

    constructor(s: string) {
        this.s = s
    }

    equal(id: ID): boolean {
        return this.toString() === id.toString()
    }

    toBytes(): Uint8Array {
        return encoder.encode(this.s)
    }

    toString(): string {
        return this.s
    }
}

export class CurrencyID extends ID {
    constructor(s: string) {
        super(s)
        Assert.check(
            Config.CURRENCY_ID.satisfy(s.length),
            MitumError.detail(ECODE.INVALID_CURRENCY_ID, "currency id length out of range")
        )
        Assert.check(
            /^[A-Z0-9][A-Z0-9_\.\!\$\*\@]*[A-Z0-9]$/.test(s),
            MitumError.detail(ECODE.INVALID_CURRENCY_ID, "invalid currency id format"),
        )
    }

    static from(s: string | CurrencyID): CurrencyID {
        return s instanceof CurrencyID ? s : new CurrencyID(s)
    }
}