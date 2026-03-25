import { STOItem } from "./item"
import { Partition } from "./partition"
import { OperationFact } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Big, HintedObject } from "../../types"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class RedeemItem extends STOItem {
    readonly tokenHolder: Address
    readonly amount: Big
    readonly partition: Partition

    constructor(
        contract: string | Address, 
        tokenHolder: string | Address,
        amount: string | number | Big,
        partition: string | Partition,
        currency: string | CurrencyID,
    ) {
        super(HINT.STO.REDEEM.ITEM, contract, currency)

        this.tokenHolder = Address.from(tokenHolder)
        this.amount  = Big.from(amount)
        this.partition = Partition.from(partition)

        Assert.check(
            this.contract.toString() !== this.tokenHolder.toString(),
            MitumError.detail(ECODE.INVALID_ITEM, "tokenHolder is same with contract address")
        )

        Assert.check(
            this.amount.overZero(),
            MitumError.detail(ECODE.INVALID_ITEM, "amount must be over zero"),  
        )
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.tokenHolder.toBytes(),
            this.amount.toBytes(),
            this.partition.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            tokenHolder: this.tokenHolder.toString(),
            amount: this.amount.toString(),
            partition: this.partition.toString(),
        }
    }

    toString(): string {
        return `${super.toString()}-${this.tokenHolder.toString()}-${this.partition.toString()}`
    }
}

export class RedeemFact extends OperationFact<RedeemItem> {
    constructor(token: string, sender: string | Address, items: RedeemItem[]) {
        super(HINT.STO.REDEEM.FACT, token, sender, items)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicate token holder found in items")
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
        return HINT.STO.REDEEM.OPERATION
    }
}