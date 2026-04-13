import { CurrencyItem } from "./item"
import { CurrencyOperationFact } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { Amount, CurrencyID } from "../../common"
import { SortFunc } from "../../utils"
import { HintedObject } from "../../types"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class WithdrawItem extends CurrencyItem {
    readonly target: Address

    constructor(target: string | Address, amounts: Amount[]) {
        super(HINT.CURRENCY.WITHDRAW.ITEM, amounts)
        this.target = typeof target === "string" ? new Address(target) : target
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.target.toBytes(),
            concatBytes(this.amounts.sort(SortFunc).map(am => am.toBytes())),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            target: this.target.toString(),
        }
    }

    toString(): string {
        return this.target.toString()
    }
}

export class WithdrawFact extends CurrencyOperationFact<WithdrawItem> {
    constructor(token: string, sender: string | Address, items: WithdrawItem[], currency: string | CurrencyID) {
        super(HINT.CURRENCY.WITHDRAW.FACT, token, sender, items, currency)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicate target found in items")
        )

        this.items.forEach(
            it => Assert.check(
                this.sender.toString() != it.target.toString(),
                MitumError.detail(ECODE.INVALID_ITEMS, "sender is same with target address"),
            )
        )
    }

    get operationHint() {
        return HINT.CURRENCY.WITHDRAW.OPERATION
    }
}