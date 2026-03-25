import { ContractFact, FactJson } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { concatBytes } from "../../utils/bytes"

const encoder = new TextEncoder();

export class SetDocumentFact extends ContractFact {
    readonly title: string
    readonly uri: string
    readonly documentHash: string

    constructor(
        token: string, 
        sender: string | Address, 
        contract: string | Address, 
        title: string,
        uri: string,
        documentHash: string,
        currency: string | CurrencyID,
    ) {
        super(HINT.STO.SET_DOCUMENT.FACT, token, sender, contract, currency)

        this.title = title
        this.uri = uri
        this.documentHash = documentHash

        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            encoder.encode(this.title),
            encoder.encode(this.uri),
            encoder.encode(this.documentHash),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            title: this.title,
            uri: this.uri,
            documenthash: this.documentHash,
        }
    }

    get operationHint() {
        return HINT.STO.SET_DOCUMENT.OPERATION
    }
}