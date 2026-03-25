import { KYCItem } from "./item"
import { OperationFact } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { HintedObject } from "../../types"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class AddControllerItem extends KYCItem {
    readonly controller: Address

    constructor(
        contract: string | Address, 
        controller: string | Address,
        currency: string | CurrencyID,
    ) {
        super(HINT.KYC.ADD_CONTROLLER.ITEM, contract, currency)

        this.controller = Address.from(controller)

        Assert.check(
            this.contract.toString() !== this.controller.toString(),
            MitumError.detail(ECODE.INVALID_ITEM, "contract is same with controller address")
        )
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.controller.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            controller: this.controller.toString(),
        }
    }

    toString(): string {
        return `${super.toString()}-${this.controller.toString()}`
    }
}

export class AddControllerFact extends OperationFact<AddControllerItem> {
    constructor(token: string, sender: string | Address, items: AddControllerItem[]) {
        super(HINT.KYC.ADD_CONTROLLER.FACT, token, sender, items)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicate controller found in items")
        )
    }

    get operationHint() {
        return HINT.KYC.ADD_CONTROLLER.OPERATION
    }
}