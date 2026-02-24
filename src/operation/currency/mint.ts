import { Buffer } from "buffer";
import { NodeFact, FactJson } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import type { Amount } from "../../common"



export class MintFact extends NodeFact {
    readonly amount: Amount
    readonly receiver: Address

    constructor(token: string, receiver: string | Address, amount: Amount) {
        super(HINT.CURRENCY.MINT.FACT, token)
        this.amount = amount
        this.receiver = Address.from(receiver)
        this._hash = this.hashing()
    }

    toBuffer(): Buffer {
        return Buffer.concat([
            super.toBuffer(),
            this.receiver.toBuffer(),
            this.amount.toBuffer(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            receiver: this.receiver.toString(),
            amount: this.amount.toHintedObject(),
        }
    }

    toString(): string {
        return `${this.receiver.toString()}-${this.amount.currency.toString()}`
    }

    get operationHint() {
        return HINT.CURRENCY.MINT.OPERATION
    }
}