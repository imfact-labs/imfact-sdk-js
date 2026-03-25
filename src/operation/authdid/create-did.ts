import { HINT } from "../../alias"
import { Address } from "../../key"
import { CurrencyID } from "../../common"
import { ContractFact, FactJson } from "../base"
import { concatBytes } from "../../utils/bytes"

export class CreateFact extends ContractFact {
    constructor(
        token: string, 
        sender: string | Address, 
        contract: string | Address,
        currency: string | CurrencyID,
    ) {
        super(HINT.AUTH_DID.CREATE_DID.FACT, token, sender, contract, currency);
        this._hash = this.hashing();
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
        }
    }

    get operationHint() {
        return HINT.AUTH_DID.CREATE_DID.OPERATION
    }
}