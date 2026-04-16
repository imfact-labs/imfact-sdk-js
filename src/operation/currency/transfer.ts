import { CurrencyItem } from "./item"
import { CurrencyOperationFact } from "../base"

import { Amount, CurrencyID } from "../../common"
import { SortFunc } from "../../utils"
import { HintedObject } from "../../types"
import { HINT, SUFFIX } from "../../alias"
import { Address, ZeroAddress } from "../../key/address"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class TransferItem extends CurrencyItem {
    readonly receiver: Address | ZeroAddress

    constructor(receiver: string | Address | ZeroAddress, amounts: Amount[]) {
        super(HINT.CURRENCY.TRANSFER.ITEM, amounts)

        if (typeof receiver === "string") {
            if (receiver.endsWith(SUFFIX.ADDRESS.ZERO)) {
                this.receiver = new ZeroAddress(receiver)
            } else {
                this.receiver = new Address(receiver)
            }
        } else {
            this.receiver = receiver
        } 

        if (this.receiver.type === "zero") {
            for (const am of amounts) {
                Assert.check(
                    am.currency.equal((this.receiver as ZeroAddress).currency), 
                    MitumError.detail(ECODE.INVALID_AMOUNT, "invalid amount currency for given zero address"),
                )
            }
        }
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.receiver.toBytes(),
            concatBytes(this.amounts.sort(SortFunc).map(am => am.toBytes())),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            receiver: this.receiver.toString(),
        }
    }

    toString(): string {
        return this.receiver.toString()
    }
}

export class TransferFact extends CurrencyOperationFact<TransferItem> {
    constructor(token: string, sender: string | Address, items: TransferItem[], currency: string | CurrencyID) {
        super(HINT.CURRENCY.TRANSFER.FACT, token, sender, items, currency)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicate receiver found in items")
        )

        this.items.forEach(
            it => Assert.check(
                this.sender.toString() != it.receiver.toString(),
                MitumError.detail(ECODE.INVALID_ITEMS, "sender is same with receiver address"),
            )
        )
    }

    get operationHint() {
        return HINT.CURRENCY.TRANSFER.OPERATION
    }
}