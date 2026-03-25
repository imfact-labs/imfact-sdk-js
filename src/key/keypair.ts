import base58 from "bs58"
import { Wallet, HDNodeWallet } from "ethers"

import { hmac } from "@noble/hashes/hmac"
import { sha256 as nobleSha256 } from "@noble/hashes/sha256"
import { utf8ToBytes } from "@noble/hashes/utils"
import * as secp256k1 from "@noble/secp256k1"

import { Key } from "./pub"
import { HDAccount, KeyPairType, defaultPath } from "./types"

import { Big } from "../types"
import { Config } from "../node"
import { SUFFIX } from "../alias"
import { sha3, sha256 } from "../utils"
import { Assert, ECODE, MitumError, StringAssert } from "../error"
import { privateKeyToPublicKey, compress } from "../utils/converter"
import { concatBytes, toBytes } from "../utils/bytes"

interface IKeyGenerator {
    random(option?: KeyPairType): BaseKeyPair
    fromPrivateKey(key: string | Key): BaseKeyPair
    fromSeed(seed: string | Uint8Array | string, option?: KeyPairType): BaseKeyPair
    hdRandom(option?: KeyPairType): HDAccount
    fromPhrase(phrase: string, path?: string, option?: KeyPairType): HDAccount
}

export abstract class BaseKeyPair {
    readonly privateKey: Key
    readonly publicKey: Key
    protected signer: Uint8Array
    protected static generator: IKeyGenerator

    protected constructor(privateKey: Key) {
        this.privateKey = privateKey
        this.signer = this.getSigner()
        this.publicKey = this.getPub()

        secp256k1.utils.hmacSha256Sync = (key, ...msgs) =>
            hmac(nobleSha256, key, secp256k1.utils.concatBytes(...msgs))
        secp256k1.utils.sha256Sync = (...msgs) =>
            nobleSha256(secp256k1.utils.concatBytes(...msgs))
  }

    abstract sign(msg: string | Uint8Array): Promise<Uint8Array>
    abstract verify(sig: string | Uint8Array, msg: string | Uint8Array): boolean

    protected abstract getSigner(): Uint8Array
    protected abstract getPub(): Key

    static random<T extends BaseKeyPair>(option?: KeyPairType): T {
        return this.generator.random(option) as T
    }

    static fromSeed<T extends BaseKeyPair>(seed: string | Uint8Array, option?: KeyPairType): T {
        return this.generator.fromSeed(seed, option) as T
    }

    static fromPrivateKey<T extends BaseKeyPair>(key: string | Key): T {
        const s = key.toString()
        StringAssert.with(s, MitumError.detail(ECODE.INVALID_PRIVATE_KEY, "invalid private key"))
        .chainAnd(s.endsWith(SUFFIX.KEY.MITUM.PRIVATE))
        .excute()
        return this.generator.fromPrivateKey(key) as T
    }

    static hdRandom(option?: KeyPairType): HDAccount {
        return this.generator.hdRandom(option) as HDAccount
    }

    static fromPhrase(phrase: string, path?: string, option?: KeyPairType): HDAccount {
        return this.generator.fromPhrase(phrase, path, option) as HDAccount
    }

    protected async ethSign(msg: string | Uint8Array): Promise<Uint8Array> {
        const msgBytes = typeof msg === "string" ? utf8ToBytes(msg) : msg

        const msgHash = nobleSha256(msgBytes)

        // 64 bytes (r || s)
        const sig = await secp256k1.sign(msgHash, this.signer, { der: false })

        const r = sig.slice(0, 32)
        const s = sig.slice(32)

        const trim = (b: Uint8Array) => {
            let i = 0
            while (i < b.length - 1 && b[i] === 0) i++
            return b.slice(i)
        }

        const rTrim = trim(r)
        const sTrim = trim(s)

        const out = new Uint8Array(4 + rTrim.length + sTrim.length)

        new DataView(out.buffer).setUint32(0, rTrim.length, true)

        out.set(rTrim, 4)
        out.set(sTrim, 4 + rTrim.length)

        return out
    }

    protected ethVerify(sig: string | Uint8Array, msg: string | Uint8Array): boolean {
        let sigBytes = typeof sig === "string" ? base58.decode(sig) : sig

        const rlen = new DataView(sigBytes.buffer, sigBytes.byteOffset, 4).getUint32(0, true)

        const r = sigBytes.slice(4, 4 + rlen)
        const s = sigBytes.slice(4 + rlen)

        const der = concatBytes([
            new Uint8Array([48, sigBytes.length, 2]),
            new Uint8Array([r.length]),
            r,
            new Uint8Array([2, s.length]),
            s,
        ])

        const msgBytes = typeof msg === "string" ? utf8ToBytes(msg) : msg

        return secp256k1.verify(
            der,
            sha256(msgBytes),
            secp256k1.getPublicKey(this.signer, true)
        )
    }

    protected static K(seed: string | Uint8Array): bigint {
        const seedBytes = typeof seed === "string" ? utf8ToBytes(seed) : seed

        let hashed = sha3(seedBytes)
        let encoded = base58.encode(hashed)
        let bytes = utf8ToBytes(encoded)

        Assert.check(40 <= bytes.length, MitumError.detail(ECODE.INVALID_SEED, "seed length out of range"))

        bytes = bytes.slice(0, 40)

        const N = secp256k1.CURVE.n - BigInt(1)

        let k = new Big(bytes).big
        k %= N
        k += BigInt(1)

        return k
    }
}

export class KeyPair extends BaseKeyPair {
    static generator = {
        fillHDAccount(kp: KeyPair, wallet: HDNodeWallet): HDAccount {
            return {
                privatekey: kp.privateKey.toString(),
                publickey: kp.publicKey.toString(),
                address: "",
                phrase: wallet.mnemonic?.phrase,
                path: wallet.path,
            }
        },

        random(): KeyPair {
            return new KeyPair(
                Wallet.createRandom().privateKey.substring(2) + SUFFIX.KEY.MITUM.PRIVATE
            )
        },

        fromSeed(seed: string): KeyPair {
            StringAssert.with(seed, MitumError.detail(ECODE.INVALID_SEED, "seed length out of range"))
            .satisfyConfig(Config.SEED)
            .excute()
            return new KeyPair(BaseKeyPair.K(seed).toString(16) + SUFFIX.KEY.MITUM.PRIVATE)
        },

        fromPrivateKey(key: string | Key): KeyPair {
            return new KeyPair(key)
        },

        hdRandom(): HDAccount {
            try {
                const wallet = HDNodeWallet.createRandom("", defaultPath);
                const kp = new KeyPair(wallet.privateKey.substring(2) + SUFFIX.KEY.MITUM.PRIVATE)
                return this.fillHDAccount(kp, wallet)
            } catch (error: any) {
                Assert.check(
                    false,
                    MitumError.detail(ECODE.UNKNOWN, `unknown error occur during HDNodeWallet.createRandom(), ${error.shortMessage}`)
                );
                throw error;
            }
        },

        fromPhrase(phrase: string, path?: string): HDAccount {
            try {
                const wallet = HDNodeWallet.fromPhrase(phrase, "", path ? path : defaultPath);
                const kp = new KeyPair(wallet.privateKey.substring(2) + SUFFIX.KEY.MITUM.PRIVATE);
                return this.fillHDAccount(kp, wallet);
            } catch(error: any) {
                if (error.argument === 'mnemonic') {
                    Assert.check(
                        false,
                        MitumError.detail(ECODE.HDWALLET.INVALID_PHRASE, `invalid phrase, ${error.shortMessage}`)
                    );
                } else {
                    Assert.check(
                        false,
                        MitumError.detail(ECODE.HDWALLET.INVALID_PATH, `invalid path, ${error.shortMessage} with value ${error.value}`)
                    );
                }
                throw error;
            }
        },
    }

    private constructor(privateKey: string | Key) {
        super(Key.from(privateKey))
    }

    protected getSigner(): Uint8Array {
        return toBytes(this.privateKey.noSuffix)
    }

    protected getPub(): Key {
        const pub = privateKeyToPublicKey("0x" + this.privateKey.noSuffix)
        return new Key(compress(pub) + SUFFIX.KEY.MITUM.PUBLIC)
    }

    async sign(msg: string | Uint8Array): Promise<Uint8Array> {
        return await this.ethSign(msg)
    }

    verify(sig: string | Uint8Array, msg: string | Uint8Array): boolean {
        return this.ethVerify(sig, msg)
    }
}