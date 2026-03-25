import { DAOFact } from "./fact"
import { FactJson } from "../base"

import { Big } from "../../types"
import { HINT } from "../../alias"
import type { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Config } from "../../node"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class VoteFact extends DAOFact {
    readonly vote: Big

    constructor(
        token: string,
        sender: string | Address,
        contract: string | Address,
        proposalID: string,
        vote: string | number | Big,
        currency: string | CurrencyID,
    ) {
        super(HINT.DAO.VOTE.FACT, token, sender, contract, proposalID, currency)
        Assert.check(
            Config.DAO.VOTE.satisfy(Number(vote)),
            MitumError.detail(ECODE.INVALID_FACT, "vote option out of range"),    
        )
        this.vote = Big.from(vote)
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.vote.v === 0 ? Uint8Array.from([0x00]) : this.vote.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            vote_option: this.vote.v,
        }
    }

    get operationHint() {
        return HINT.DAO.VOTE.OPERATION
    }
}