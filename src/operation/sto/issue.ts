import { STOItem } from "./item"
import { Partition } from "./partition"
import { OperationFact } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Big, HintedObject } from "../../types"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class IssueItem extends STOItem {
    readonly receiver: Address
    readonly amount: Big
    readonly partition: Partition

    constructor(
        contract: string | Address,
        receiver: string | Address,
        amount: string | number | Big,
        partition: string | Partition,
        currency: string | CurrencyID,
    ) {
        super(HINT.STO.ISSUE.ITEM, contract, currency)

        this.receiver = Address.from(receiver)
        this.amount  = Big.from(amount)
        this.partition = Partition.from(partition)

        Assert.check(
            this.contract.toString() !== this.receiver.toString(),
            MitumError.detail(ECODE.INVALID_ITEM, "receiver is same with contract address")
        )

        Assert.check(
            this.amount.overZero(),
            MitumError.detail(ECODE.INVALID_ITEM, "amount must be over zero"),    
        )
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.receiver.toBytes(),
            this.amount.toBytes(),
            this.partition.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            receiver: this.receiver.toString(),
            amount: this.amount.toString(),
            partition: this.partition.toString(),
        }
    }

    toString(): string {
        return `${super.toString()}-${this.receiver.toString()}-${this.partition.toString()}`
    }
}

export class IssueFact extends OperationFact<IssueItem> {
    constructor(token: string, sender: string | Address, items: IssueItem[]) {
        super(HINT.STO.ISSUE.FACT, token, sender, items)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicate contract found in items")
        )

        items.forEach(
            item => {
                Assert.check(
                    item.contract.toString() !== sender.toString(),
                    MitumError.detail(ECODE.INVALID_ITEMS, "sender is same with contract address")
                )
            }
        )
    }

    get operationHint() {
        return HINT.STO.ISSUE.OPERATION
    }
}