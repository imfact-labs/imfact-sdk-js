import base58 from "bs58"

import { CurrencyItem } from "./item"
import { CurrencyOperationFact } from "../base"

import { Amount, CurrencyID } from "../../common"
import { SortFunc } from "../../utils"
import { HINT } from "../../alias"
import { HintedObject } from "../../types"
import { Keys, Address } from "../../key"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class CreateContractAccountItem extends CurrencyItem {
    readonly keys: Keys
    
    constructor(keys: Keys, amounts: Amount[]) {
        super(HINT.CURRENCY.CREATE_CONTRACT_ACCOUNT.ITEM, amounts)
        this.keys = keys
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.keys.toBytes(),
            concatBytes(this.amounts.sort(SortFunc).map(am => am.toBytes())),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            keys: this.keys.toHintedObject(),
        }
    }

    toString(): string {
        return base58.encode(this.keys.toBytes())
    }
}

export class CreateContractAccountFact extends CurrencyOperationFact<CreateContractAccountItem> {
    constructor(token: string, sender: string | Address, items: CreateContractAccountItem[], currency: string | CurrencyID) {
        super(HINT.CURRENCY.CREATE_CONTRACT_ACCOUNT.FACT, token, sender, items, currency)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicate key hash found in items")
        )
    }

    get operationHint() {
        return HINT.CURRENCY.CREATE_CONTRACT_ACCOUNT.OPERATION
    }
}