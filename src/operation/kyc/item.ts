import { Item } from "../base"

import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { HintedObject } from "../../types"
import { concatBytes } from "../../utils/bytes"

export abstract class KYCItem extends Item {
    readonly contract: Address
    readonly currency: CurrencyID

    protected constructor(
        hint: string, 
        contract: string | Address,
        currency: string | CurrencyID,
    ) {
        super(hint)

        this.contract = Address.from(contract)
        this.currency = CurrencyID.from(currency)
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.contract.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            contract: this.contract.toString(),
            currency: this.currency.toString(),
        }
    }

    toString(): string {
        return this.contract.toString()
    }
}