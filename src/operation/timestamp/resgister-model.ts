import { TimeStampFact } from "./fact"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { concatBytes } from "../../utils/bytes"

export class RegisterModelFact extends TimeStampFact {
    constructor(
        token: string, 
        sender: string | Address, 
        contract: string | Address, 
        currency: string | CurrencyID,
    ) {
        super(HINT.TIMESTAMP.REGISTER_MODEL.FACT, token, sender, contract, currency)
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
        ])
    }

    get operationHint() {
        return HINT.TIMESTAMP.REGISTER_MODEL.OPERATION
    }
}