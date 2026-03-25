import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { ContractFact } from "../base"
import { CurrencyID } from "../../common"
import { concatBytes } from "../../utils/bytes"

export class RegisterModelFact extends ContractFact {
    constructor(
        token: string, 
        sender: string | Address, 
        contract: string | Address, 
        currency: string | CurrencyID,
    ) {
        super(HINT.CREDENTIAL.REGISTER_MODEL.FACT, token, sender, contract, currency)
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.currency.toBytes(),
        ])
    }

    get operationHint() {
        return HINT.CREDENTIAL.REGISTER_MODEL.OPERATION
    }
}