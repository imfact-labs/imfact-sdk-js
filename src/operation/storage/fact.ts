import { ContractFact, FactJson } from "../base"

import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { LongString } from "../../types"
import { concatBytes } from "../../utils/bytes"

export abstract class StorageFact extends ContractFact {
    readonly dataKey: LongString
    protected constructor(
        hint: string,
        token: string,
        sender: string | Address,
        contract: string | Address,
        dataKey: string | LongString,
        currency: string | CurrencyID,
    ) {
        super(hint, token, sender, contract, currency)
        this.dataKey = LongString.from(dataKey)

        // Assert.check(
        //     this.decimal.compare(0) >= 0,
        //     MitumError.detail(ECODE.INVALID_FACT, "decimal number under zero"),
        // )
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.dataKey.toBytes()
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            dataKey:  this.dataKey.toString(),
        }
    }
}