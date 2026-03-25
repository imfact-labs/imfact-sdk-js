import { ContractFact, FactJson } from "../base"

import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { URIString } from "../../types"
import { concatBytes } from "../../utils/bytes"

export abstract class DAOFact extends ContractFact {
    readonly proposalID: URIString

    protected constructor(
        hint: string,
        token: string,
        sender: string | Address,
        contract: string | Address,
        proposalID: string, 
        currency: string | CurrencyID,
    ) {
        super(hint, token, sender, contract, currency)
        this.proposalID = new URIString(proposalID, 'proposalID');
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.proposalID.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            proposal_id: this.proposalID.toString(),
        }
    }
}