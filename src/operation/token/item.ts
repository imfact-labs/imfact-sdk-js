import { Item } from "../base"
import { Big } from "../../types"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { HintedObject } from "../../types"

export abstract class TokenItem extends Item {
    readonly contract: Address
    readonly currency: CurrencyID
    readonly amount: Big

    protected constructor(hint: string, contract: string | Address, amount: string | number | Big, currency: string | CurrencyID) {
        super(hint)

        this.contract = Address.from(contract)
        this.amount = Big.from(amount)
        this.currency = CurrencyID.from(currency)
    }

    toBytes(): Uint8Array {
        return this.contract.toBytes()
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            contract: this.contract.toString(),
        }
    }

    toString(): string {
        return this.contract.toString()
    }
}