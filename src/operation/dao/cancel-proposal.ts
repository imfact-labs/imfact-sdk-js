import { DAOFact } from "./fact"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { concatBytes } from "../../utils/bytes"

export class CancelProposalFact extends DAOFact {
    constructor(
        token: string,
        sender: string | Address,
        contract: string | Address,
        proposalID: string,
        currency: string | CurrencyID,
    ) {
        super(HINT.DAO.CANCEL_PROPOSAL.FACT, token, sender, contract, proposalID, currency)
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.currency.toBytes(),
        ])
    }

    get operationHint() {
        return HINT.DAO.CANCEL_PROPOSAL.OPERATION
    }
}