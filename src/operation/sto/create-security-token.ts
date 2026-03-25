import { STOItem } from "./item"
import { Partition } from "./partition"
import { OperationFact } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Big, HintedObject } from "../../types"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class CreateSecurityTokenItem extends STOItem {
    readonly granularity: Big
    readonly defaultPartition: Partition

    constructor(
        contract: string | Address, 
        granularity: string | number | Big,
        defaultPartition: string | Partition,
        currency: string | CurrencyID,
    ) {
        super(HINT.STO.CREATE_SECURITY_TOKEN.ITEM, contract, currency)

        this.granularity = Big.from(granularity)
        this.defaultPartition = Partition.from(defaultPartition)

        Assert.check(
            this.granularity.overZero(),
            MitumError.detail(ECODE.INVALID_ITEM, "granularity must be over zero"),    
        )
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.contract.toBytes(),
            this.granularity.toBytes("fill"),
            this.defaultPartition.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            granularity: this.granularity.v,
            default_partition: this.defaultPartition.toString(),
        }
    }

    toString(): string {
        return `${super.toString()}-${this.defaultPartition.toString()}`
    }
}

export class CreateSecurityTokenFact extends OperationFact<CreateSecurityTokenItem> {
    constructor(token: string, sender: string | Address, items: CreateSecurityTokenItem[]) {
        super(HINT.STO.CREATE_SECURITY_TOKEN.FACT, token, sender, items)

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
        return HINT.STO.CREATE_SECURITY_TOKEN.OPERATION
    }
}