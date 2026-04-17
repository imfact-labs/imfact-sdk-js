import { Item } from "../base"

import { Address } from "../../key/address"
import { HintedObject } from "../../types"

export abstract class NFTItem extends Item {
    readonly contract: Address

    protected constructor(hint: string, contract: string | Address) {
        super(hint)

        this.contract = Address.from(contract)
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