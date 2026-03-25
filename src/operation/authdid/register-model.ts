import { HINT } from "../../alias"
import { Address } from "../../key"
import { LongString } from "../../types"
import { CurrencyID } from "../../common"
import { ContractFact, FactJson } from "../base"
import { concatBytes } from "../../utils/bytes"


export class RegisterModelFact extends ContractFact {
    readonly didMethod: LongString

    constructor(
        token: string, 
        sender: string | Address, 
        contract: string | Address,
        didMethod: string,
        currency: string | CurrencyID,
    ) {
        super(HINT.AUTH_DID.REGISTER_MODEL.FACT, token, sender, contract, currency)

        this.didMethod = LongString.from(didMethod)
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.didMethod.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            didMethod: this.didMethod.toString(),
        }
    }

    get operationHint() {
        return HINT.AUTH_DID.REGISTER_MODEL.OPERATION
    }
}

