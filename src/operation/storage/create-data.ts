import { HINT } from "../../alias"
import { Config } from "../../node"
import { Address } from "../../key/address"
import type { HintedObject } from "../../types"
import { LongString, URIString } from "../../types"
import { CurrencyID } from "../../common"
import { Assert, ECODE, MitumError } from "../../error"
import { Item, ItemOperationFact } from "../base"
import { concatBytes } from "../../utils/bytes"

export class CreateDataItem extends Item {
    readonly contract: Address
    readonly dataKey: URIString
    readonly dataValue: LongString

    constructor(contract: string | Address, dataKey: string, dataValue: string | LongString) {
        super(HINT.STORAGE.CREATE_DATA.ITEM)

        this.contract = Address.from(contract)
        this.dataKey = new URIString(dataKey, "dataKey");
        this.dataValue = LongString.from(dataValue)

        Assert.check(
            Config.STORAGE.DATA_KEY.satisfy(dataKey.toString().length),
            MitumError.detail(ECODE.INVALID_ITEM, `dataKey length out of range, should be between ${Config.STORAGE.DATA_KEY.min} to ${Config.STORAGE.DATA_KEY.max}`),
        )
        Assert.check(
            Config.STORAGE.DATA_VALUE.satisfy(dataValue.toString().length),
            MitumError.detail(ECODE.INVALID_ITEM, `dataValue out of range, should be between ${Config.STORAGE.DATA_VALUE.min} to ${Config.STORAGE.DATA_VALUE.max}`),
        )
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.contract.toBytes(),
            this.dataKey.toBytes(),
            this.dataValue.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            contract: this.contract.toString(),
            dataKey: this.dataKey.toString(),
            dataValue: this.dataValue.toString(),
        }
    }

    toString(): string {
        return this.dataKey.toString() + this.contract.toString()
    }
}

export class CreateDataFact extends ItemOperationFact<CreateDataItem> {
    constructor(token: string, sender: string | Address, items: CreateDataItem[], currency: string | CurrencyID) {
        super(HINT.STORAGE.CREATE_DATA.FACT, token, sender, items, currency)

        this.items.forEach(
            it => {
                Assert.check(
                    this.sender.toString() != it.contract.toString(),
                    MitumError.detail(ECODE.INVALID_ITEMS, "sender is same with contract address"),
                )
            }
        )
    }

    get operationHint() {
        return HINT.STORAGE.CREATE_DATA.OPERATION
    }
}