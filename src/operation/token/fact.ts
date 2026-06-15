import { ContractFact } from "../base"
import type { HintedFactObject } from "../base"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { concatBytes } from "../../utils/bytes"

export abstract class TokenFact extends ContractFact {
    protected constructor(
        hint: string,
        token: string,
        sender: string | Address,
        contract: string | Address,
        currency: string | CurrencyID,
    ) {
        super(hint, token, sender, contract, currency)
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): HintedFactObject {
        return {
            ...super.toHintedObject(),
        }
    }
}