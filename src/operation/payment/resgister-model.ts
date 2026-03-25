import { PaymentFact } from "./fact"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { concatBytes } from "../../utils/bytes"

export class RegisterModelFact extends PaymentFact {
    constructor(
        token: string, 
        sender: string | Address, 
        contract: string | Address, 
        currency: string | CurrencyID,
    ) {
        super(HINT.PAYMENT.REGISTER_MODEL.FACT, token, sender, contract, currency)
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.currency.toBytes()
        ])
    }

    get operationHint() {
        return HINT.PAYMENT.REGISTER_MODEL.OPERATION
    }
}