import { OperationFact } from "../base"
import { CredentialItem } from "./item"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class RevokeItem extends CredentialItem {
    constructor(
        contract: string | Address, 
        holder: string | Address, 
        templateID: string,
        credentialID: string,
        currency: string | CurrencyID,
    ) {
        super(HINT.CREDENTIAL.REVOKE.ITEM, contract, holder, templateID, credentialID, currency)
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toString(): string {
        return `${super.toString()}-${this.templateID}-${this.credentialID}`
    }
}

export class RevokeFact extends OperationFact<RevokeItem> {
    constructor(token: string, sender: string | Address, items: RevokeItem[]) {
        super(HINT.CREDENTIAL.REVOKE.FACT, token, sender, items)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, `each item's combination of contract-templateID-credentialID must be unique`)
        )

        items.forEach(
            item => {
                Assert.check(
                    item.contract.toString() !== sender.toString(),
                    MitumError.detail(ECODE.INVALID_ITEMS, "sender is same with contract address")
                )
            }
        )
    }

    get operationHint() {
        return HINT.CREDENTIAL.REVOKE.OPERATION
    }
}