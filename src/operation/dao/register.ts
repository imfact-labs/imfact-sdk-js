import { DAOFact } from "./fact"
import { FactJson } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class RegisterFact extends DAOFact {
    readonly approved: Address

    constructor(
        token: string,
        sender: string | Address,
        contract: string | Address,
        proposalID: string,
        approved: string | Address,
        currency: string | CurrencyID,
    ) {
        super(HINT.DAO.REGISTER.FACT, token, sender, contract, proposalID, currency)
        
        this.approved = Address.from(approved)

        Assert.check(
            this.contract.toString() !== this.approved.toString(),
            MitumError.detail(ECODE.INVALID_FACT, "contract is same with approved address")
        )
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.approved.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            approved: this.approved.toString(),
        }
    }

    get operationHint() {
        return HINT.DAO.REGISTER.OPERATION
    }
}