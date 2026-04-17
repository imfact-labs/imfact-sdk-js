import { Item } from "../base"
import { Big } from "../../types"
import { Address } from "../../key/address"
import { HintedObject } from "../../types"

export abstract class TokenItem extends Item {
    readonly contract: Address
    readonly amount: Big

    protected constructor(hint: string, contract: string | Address, amount: string | number | Big) {
        super(hint)

        this.contract = Address.from(contract)
        this.amount = Big.from(amount)
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