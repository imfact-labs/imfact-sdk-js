import { ContractFact, FactJson } from "../base"

import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { concatBytes } from "../../utils/bytes"

export abstract class PaymentFact extends ContractFact {
    protected constructor(
        hint: string,
        token: string,
        sender: string | Address,
        contract: string | Address,
        currency: string | CurrencyID,
    ) {
        super(hint, token, sender, contract, currency)
        // this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
        }
    }
}