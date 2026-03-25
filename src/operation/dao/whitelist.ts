import { HINT } from "../../alias"
import { Hint } from "../../common"
import { Config } from "../../node"
import { Address } from "../../key/address"
import { ArrayAssert } from "../../error"
import { SortFunc } from "../../utils"
import { Bool } from "../../types"
import type { HintedObject, IBytes, IHintedObject } from "../../types"
import { concatBytes } from "../../utils/bytes"

export class Whitelist implements IBytes, IHintedObject {
    private hint: Hint
    readonly active: Bool
    readonly accounts: Address[]

    constructor(active: boolean | Bool, accounts: (string | Address)[]) {
        this.hint = new Hint(HINT.DAO.WHITELIST)
        this.active = Bool.from(active)
        this.accounts = accounts ? accounts.map(a => Address.from(a)) : []

        ArrayAssert.check(accounts, "whitelist").rangeLength(Config.DAO.ADDRESS_IN_WHITELIST).noDuplicates()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.active.toBytes(),
            concatBytes(this.accounts.sort(SortFunc).map(a => a.toBytes())),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            _hint: this.hint.toString(),
            active: this.active.v,
            accounts: this.accounts.sort(SortFunc).map(a => a.toString()),
        }
    }
}