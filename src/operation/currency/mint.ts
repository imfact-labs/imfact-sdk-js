import { NodeFact, FactJson } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import type { Amount } from "../../common"
import { concatBytes } from "../../utils/bytes"


export class MintFact extends NodeFact {
    readonly amount: Amount
    readonly receiver: Address

    constructor(token: string, receiver: string | Address, amount: Amount) {
        super(HINT.CURRENCY.MINT.FACT, token)
        this.amount = amount
        this.receiver = Address.from(receiver)
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.receiver.toBytes(),
            this.amount.toBytes(),
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