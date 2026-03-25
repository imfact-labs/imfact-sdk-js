import { Item } from "../base"

import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { HintedObject } from "../../types"

export abstract class NFTItem extends Item {
    readonly contract: Address
    readonly currency: CurrencyID

    protected constructor(hint: string, contract: string | Address, currency: string | CurrencyID) {
        super(hint)

        this.contract = Address.from(contract)
        this.currency = CurrencyID.from(currency)
    }

    toBytes(): Uint8Array {
        return this.contract.toBytes()
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