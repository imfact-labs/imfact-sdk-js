import { Fact, FactJson } from "../base"

import { HINT } from "../../alias"
import { CurrencyID } from "../../common"
import { Address } from "../../key/address"
import { Keys } from "../../key/pub"
import { concatBytes } from "../../utils/bytes"

export class UpdateKeyFact extends Fact {
    readonly sender: Address
    readonly keys: Keys
    readonly currency: CurrencyID

    constructor(token: string, sender: string | Address, keys: Keys, currency: string | CurrencyID) {
        super(HINT.CURRENCY.UPDATE_KEY.FACT, token)
        this.sender = Address.from(sender)
        this.keys = keys
        this.currency = CurrencyID.from(currency)
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.sender.toBytes(),
            this.keys.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            sender: this.sender.toString(),
            keys: this.keys.toHintedObject(),
            currency: this.currency.toString(),
        }
    }

    get operationHint() {
        return HINT.CURRENCY.UPDATE_KEY.OPERATION
    }
}