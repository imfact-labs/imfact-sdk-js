import type { FactJson } from "../base"
import { StorageFact } from "./fact"
import type { LongString } from "../../types"
import { HINT } from "../../alias"
import { Config } from "../../node"
import type { Address } from "../../key/address"
import type { CurrencyID } from "../../common"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class DeleteDataFact extends StorageFact {
    constructor(
        token: string,
        sender: string | Address,
        contract: string | Address,
        dataKey: string | LongString,
        currency: string | CurrencyID,
    ) {
        super(HINT.STORAGE.DELETE_DATA.FACT, token, sender, contract, dataKey, currency)

        Assert.check(
            Config.STORAGE.DATA_KEY.satisfy(dataKey.toString().length),
            MitumError.detail(ECODE.INVALID_FACT, `dataKey length out of range, should be between ${Config.STORAGE.DATA_KEY.min} to ${Config.STORAGE.DATA_KEY.max}`),
        )
        
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
        }
    }

    get operationHint() {
        return HINT.STORAGE.DELETE_DATA.OPERATION
    }
}