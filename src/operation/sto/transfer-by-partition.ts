import { STOItem } from "./item"
import { Partition } from "./partition"
import { OperationFact } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Big, HintedObject } from "../../types"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class TransferByPartitionItem extends STOItem {
    readonly tokenHolder: Address
    readonly receiver: Address
    readonly partition: Partition
    readonly amount: Big

    constructor(
        contract: string | Address, 
        tokenHolder: string | Address,
        receiver: string | Address,
        partition: string | Partition,
        amount: string | number | Big,
        currency: string | CurrencyID,
    ) {
        super(HINT.STO.TRANSFER_BY_PARTITION.ITEM, contract, currency)

        this.tokenHolder = Address.from(tokenHolder)
        this.receiver = Address.from(receiver)
        this.partition = Partition.from(partition)
        this.amount  = Big.from(amount)

        Assert.check(
            this.contract.toString() !== this.tokenHolder.toString(),
            MitumError.detail(ECODE.INVALID_ITEM, "tokenHolder is same with contract address")
        )

        Assert.check(
            this.contract.toString() !== this.receiver.toString(),
            MitumError.detail(ECODE.INVALID_ITEM, "receiver is same with contract address")
        )

        Assert.check(
            this.tokenHolder.toString() !== this.receiver.toString(),
            MitumError.detail(ECODE.INVALID_ITEM, "tokenHolder is same with receiver address")
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
            this.receiver.toBytes(),
            this.partition.toBytes(),
            this.amount.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            tokenholder: this.tokenHolder.toString(),
            receiver: this.receiver.toString(),
            partition: this.partition.toString(),
            amount: this.amount.toString(),
        }
    }

    toString(): string {
        return `${super.toString()}-${this.tokenHolder.toString()}-${this.receiver.toString()}-${this.partition.toString()}`
    }
}

export class TransferByPartitionFact extends OperationFact<TransferByPartitionItem> {
    constructor(token: string, sender: string | Address, items: TransferByPartitionItem[]) {
        super(HINT.STO.TRANSFER_BY_PARTITION.FACT, token, sender, items)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicate token holder-receiver-partition found in items")
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
        return HINT.STO.TRANSFER_BY_PARTITION.OPERATION
    }
}