import { Item } from "../base"
import { Big } from "../../types"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { HintedObject } from "../../types"
import { concatBytes } from "../../utils/bytes"

export abstract class PointItem extends Item {
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
        return concatBytes([
            this.contract.toBytes(),
        ])
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