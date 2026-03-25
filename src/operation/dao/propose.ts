import { DAOFact } from "./fact"
import { FactJson } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { BizProposal, CryptoProposal } from "./proposal"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class ProposeFact extends DAOFact {
    readonly proposal: CryptoProposal | BizProposal

    constructor(
        token: string,
        sender: string | Address,
        contract: string | Address,
        proposalID: string,
        proposal: CryptoProposal | BizProposal,
        currency: string | CurrencyID,
    ) {
        super(HINT.DAO.PROPOSE.FACT, token, sender, contract, proposalID, currency)
        this.proposal = proposal
 
        Assert.check(proposal.proposer.toString() === sender, 
            MitumError.detail(ECODE.DAO.UNMATCHED_SENDER, `sender is unmatched with proposer of given proposal`)
        )
        
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.proposal.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            proposal: this.proposal.toHintedObject(),
        }
    }

    get operationHint() {
        return HINT.DAO.PROPOSE.OPERATION
    }
}