import { CurrencyPolicy } from "./currency-design"
import { FactJson, NodeFact } from "../base"

import { HINT } from "../../alias"
import { CurrencyID } from "../../common"
import { concatBytes } from "../../utils/bytes"

export class UpdateCurrencyFact extends NodeFact {
    readonly currency: CurrencyID
    readonly policy: CurrencyPolicy

    constructor(token: string, currency: string | CurrencyID, policy: CurrencyPolicy) {
        super(HINT.CURRENCY.UPDATE_CURRENCY.FACT, token)
        this.currency = CurrencyID.from(currency)
        this.policy = policy
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.currency.toBytes(),
            this.policy.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            currency: this.currency.toString(),
            policy: this.policy.toHintedObject(),
        }
    }

    get operationHint() {
        return HINT.CURRENCY.UPDATE_CURRENCY.OPERATION
    }
}