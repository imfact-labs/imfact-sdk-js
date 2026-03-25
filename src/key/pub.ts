import { keccak256 as keccak256js } from "js-sha3";

import { Address } from "./address"
import { KeyPairType } from "./types"

import { Hint } from "../common"
import { Config } from "../node/config"
import { HINT, SUFFIX } from "../alias"
import { keccak256 } from "../utils/hash"
import { Assert, ECODE, MitumError, StringAssert } from "../error"
import { Big, HintedObject, IBytes, IHintedObject, IString } from "../types"
import { concatBytes } from "../utils/bytes"

type BigArg = string | number | Big
type Pub = [string | Key, BigArg] | PubKey

const encoder = new TextEncoder()

export class Key implements IBytes, IString {
    private readonly key: string
    private readonly suffix: string
    readonly type: KeyPairType
    readonly isPriv: boolean

    constructor(s: string) {
        StringAssert.with(s, MitumError.detail(ECODE.INVALID_KEY, "invalid key"))
        .empty().not()
        .chainOr(
            s.endsWith(SUFFIX.KEY.MITUM.PRIVATE),
            s.endsWith(SUFFIX.KEY.MITUM.PUBLIC),
        )
        .excute()

        if (s.endsWith(SUFFIX.KEY.MITUM.PRIVATE)) {
            StringAssert.with(s, MitumError.detail(ECODE.INVALID_PRIVATE_KEY, "invalid private key"))
            .chainAnd(
                s.endsWith(SUFFIX.KEY.MITUM.PRIVATE) && Config.KEY.MITUM.PRIVATE.satisfy(s.length),
                /^[0-9a-f]+$/.test(s.substring(0, s.length - Config.SUFFIX.DEFAULT.value!)))
            .excute()
        } else {
            StringAssert.with(s, MitumError.detail(ECODE.INVALID_PUBLIC_KEY, "invalid public key"))
            .chainAnd(
                s.endsWith(SUFFIX.KEY.MITUM.PUBLIC) && Config.KEY.MITUM.PUBLIC.satisfy(s.length),
                /^[0-9a-f]+$/.test(s.substring(0, s.length - Config.SUFFIX.DEFAULT.value!))
            )
            .excute()
        }

        this.key = s.substring(0, s.length - Config.SUFFIX.DEFAULT.value!)
        this.suffix = s.substring(s.length - Config.SUFFIX.DEFAULT.value!)

        this.type = "mitum"
        this.isPriv = s.endsWith(SUFFIX.KEY.MITUM.PRIVATE)
    }

    static from(s: string | Key) {
        return s instanceof Key ? s : new Key(s)
    }

    get noSuffix(): string {
        return this.key
    }

    toBytes(): Uint8Array {
        return encoder.encode(this.toString())
    }

    toString(): string {
        return this.key + this.suffix
    }
}

export class PubKey extends Key implements IHintedObject, IBytes {
    private static hint = new Hint(HINT.CURRENCY.KEY)
    readonly weight: Big

    constructor(key: string | Key, weight: number | string | Big) {
        super(typeof key === "string" ? key : key.toString())
        this.weight = Big.from(weight)

        const s = key.toString();
        StringAssert.with(s, MitumError.detail(ECODE.INVALID_PUBLIC_KEY, "invalid public key"))
            .chainAnd(s.endsWith(SUFFIX.KEY.MITUM.PUBLIC))
            .excute();

        Assert.check(
            Config.WEIGHT.satisfy(this.weight.v),
            MitumError.detail(ECODE.INVALID_PUBLIC_KEY, "weight out of range")
        )
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.weight.toBytes("fill"),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            _hint: PubKey.hint.toString(),
            weight: this.weight.v,
            key: this.toString(),
        }
    }
}

export class Keys implements IBytes, IHintedObject {
    private static hint = new Hint(HINT.CURRENCY.KEYS)
    private readonly _keys: PubKey[]
    readonly threshold: Big

    constructor(keys: Pub[], threshold: BigArg) {
        Assert.check(
            Config.KEYS_IN_ACCOUNT.satisfy(keys.length),
            MitumError.detail(ECODE.INVALID_KEYS, "keys length out of range")
        )

        this._keys = keys.map(k => k instanceof PubKey ? k : new PubKey(k[0], k[1]))
        this.threshold = threshold instanceof Big ? threshold : new Big(threshold)

        const _sum = this._keys.reduce((total, key) => total + key.weight.v, 0);

        Assert.check(
            this.threshold.v <= _sum,
            MitumError.detail(ECODE.INVALID_KEYS, `sum of weights under threshold, ${_sum} < ${this.threshold.v}`)
        )
        Assert.check(
            Config.THRESHOLD.satisfy(this.threshold.v),
            MitumError.detail(ECODE.INVALID_KEYS, "threshold out of range")
        )
        Assert.check(
            new Set(this._keys.map(k => k.toString())).size === this._keys.length,
            MitumError.detail(ECODE.INVALID_KEYS, "duplicate keys found in keys")
        )
    }

    get keys(): PubKey[] {
        return this._keys
    }

    private sortKeys(): PubKey[] {
        return [...this._keys].sort((a, b) => {
            const ab = a.toBytes()
            const bb = b.toBytes()
            const len = Math.min(ab.length, bb.length)

            for (let i = 0; i < len; i++) {
                if (ab[i] !== bb[i]) return ab[i] - bb[i]
            }
            return ab.length - bb.length
        })
    }

    get checksum(): Address {
        const raw = keccak256(this.toBytes()).slice(12)

        let hex = ""
        for (const b of raw) {
            hex += b.toString(16).padStart(2, "0")
        }

        const hash = keccak256(encoder.encode(hex))

        const hashHex = Array.from(hash)
            .map(b => b.toString(16).padStart(2, "0"))
            .join("")

        let checksum = "0x"
        for (let i = 0; i < hex.length; i++) {
            checksum += parseInt(hashHex[i], 16) > 7
                ? hex[i].toUpperCase()
                : hex[i]
        }

        return new Address(checksum + SUFFIX.ADDRESS.MITUM)
    }

    toBytes(): Uint8Array {
        return concatBytes([
            concatBytes(this.sortKeys().map(k => k.toBytes())),
            this.threshold.toBytes("fill"),
        ])
    }

    toHintedObject(): HintedObject {
        const eHash = keccak256js(this.toBytes())

        return {
            _hint: Keys.hint.toString(),
            hash: eHash.slice(24),
            keys: this.sortKeys().map(k => k.toHintedObject()),
            threshold: this.threshold.v,
        }
    }
}