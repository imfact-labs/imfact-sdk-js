import base58 from "bs58"

import { Fact } from "./fact"
import { OperationJson, SignOption } from "./types"
import { GeneralFactSign, NodeFactSign } from "./factsign"
import { Hint } from "../../common"
import { SortFunc, sha3 } from "../../utils"
import { concatBytes } from "../../utils/bytes"
import { Assert, ECODE, MitumError } from "../../error"
import { Address, NodeAddress } from "../../key/address"
import { Key } from "../../key/pub"
import { KeyPair } from "../../key/keypair"
import { IBytes, IHintedObject, TimeStamp } from "../../types"

type FactSign = GeneralFactSign | NodeFactSign
type SigType = "FactSign" | "NodeFactSign" | null

const encoder = new TextEncoder();

export class BaseOperation<T extends Fact> implements IBytes, IHintedObject {
    readonly id: string
    readonly hint: Hint
    readonly fact: T
    protected _factSigns: FactSign[]
    protected _hash: Uint8Array

    constructor(networkID: string, fact: T) {
        this.id = networkID
        this.fact = fact

        this.hint = new Hint(fact.operationHint)
        this._factSigns = []
        this._hash = new Uint8Array()
    }

    setFactSigns(factSigns: FactSign[]) {
        if (!factSigns) {
            return
        }

        Assert.check(
            new Set(factSigns.map(fs => fs.signer.toString())).size === factSigns.length,
            MitumError.detail(ECODE.INVALID_FACTSIGNS, "duplicate signers found in factsigns"),
        )

        this._factSigns = factSigns
        this._hash = this.hashing()
    }

    get factSigns() {
        return this._factSigns
    }

    get hash() {
        return this._hash
    }

    get factSignType() {
        return this.getSigType()
    }

    private getSigType(factSigns?: FactSign[]): SigType {
        if (!factSigns) {
            factSigns = this._factSigns
        }

        if (factSigns.length === 0) {
            return null
        }

        const set = new Set(factSigns.map(fs => Object.getPrototypeOf(fs).constructor.name))
        Assert.check(set.size === 1, MitumError.detail(ECODE.INVALID_FACTSIGNS, "multiple sig-type in operation"))

        return Array.from(set)[0]
    }

    hashing(force?: "force"): Uint8Array {
        const b = sha3(this.toBytes())

        if (force === "force") {
            this._hash = b
        }

        return b
    }

    async sign(privateKey: string | Key, option?: SignOption): Promise<void> {
        const key = Key.from(privateKey)
        const keypair = KeyPair.fromPrivateKey<KeyPair>(key)

        const sigType = this.factSignType

        if (sigType === "NodeFactSign") {
            Assert.check(option !== undefined, MitumError.detail(ECODE.FAIL_SIGN, "no node address in sign option"))
        }

        const node = option ? new NodeAddress(option.node ?? "") : undefined
        const factSign = await this.signWithSigType(sigType, keypair, node)
        const signer = keypair.publicKey.toString()
        const idx = this._factSigns.findIndex(fs => fs.signer.toString() === signer)

        if (idx < 0) {
            this._factSigns.push(factSign)
        } else {
            this._factSigns[idx] = factSign
        }

        this._hash = this.hashing("force")
    }

    private async signWithSigType(sigType: SigType, keypair: KeyPair, node?: Address): Promise<FactSign> {
        const now = TimeStamp.new()

        if (sigType === "NodeFactSign" || (!sigType && node)) {
            Assert.check(node !== undefined, MitumError.detail(ECODE.FAIL_SIGN, "no node address"))

            const sig = await keypair.sign(concatBytes([encoder.encode(this.id), node!.toBytes(), this.fact.hash, now.toBytes()]))

            return new NodeFactSign(
                node!.toString(),
                keypair.publicKey,
                sig,
                now.toString()
            )
        }

        const sig = await keypair.sign(concatBytes([encoder.encode(this.id), this.fact.hash, now.toBytes()]))

        return new GeneralFactSign(
            keypair.publicKey,
            sig,
            now.toString()
        )
    }

    toBytes(): Uint8Array {
        if (this._factSigns.length === 0) {
            return this.fact.hash
        }

        const sorted = [...this._factSigns].sort(SortFunc)

        return concatBytes([
            this.fact.hash,
            concatBytes(sorted.map(fs => fs.toBytes())),
        ])
    }

    toHintedObject(): OperationJson {
        const operation = {
            _hint: this.hint.toString(),
            fact: this.fact.toHintedObject(),
            hash: this._hash.length === 0 ? "" : base58.encode(this._hash)
        }

        const factSigns = this._factSigns.length === 0 ? [] : [...this._factSigns].sort(SortFunc)

        return {
            ...operation,
            signs: factSigns.map(fs => fs.toHintedObject())
        }
    }

    // export(filePath: string) {
    //     writeFile(filePath, JSON.stringify(this.toHintedObject(), null, 4), (e) => {
    //         if (e) {
    //             throw MitumError.detail(ECODE.FAIL_FILE_CREATION, "fs write-file failed")
    //         }
    //     })
    // }
}