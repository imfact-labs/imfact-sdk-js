import { OperationFact } from "../base"
import { CredentialItem } from "./item"

import { HINT } from "../../alias"
import { Config } from "../../node"
import type { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Assert, ECODE, MitumError } from "../../error"
import { Big, HintedObject } from "../../types"
import { concatBytes } from "../../utils/bytes"

const encoder = new TextEncoder();
export class IssueItem extends CredentialItem {
    readonly value: string
    readonly validFrom: Big
    readonly validUntil: Big
    readonly did: string

    constructor(
        contract: string | Address, 
        holder: string | Address, 
        templateID: string,
        credentialID: string,
        value: string,
        validFrom: string | number | Big,
        validUntil: string | number | Big,
        did: string,
        currency: string | CurrencyID,
    ) {
        super(HINT.CREDENTIAL.ISSUE.ITEM, contract, holder, templateID, credentialID, currency)

        this.value = value
        this.validFrom = Big.from(validFrom)
        this.validUntil = Big.from(validUntil)
        this.did = did

        Assert.check(
            Config.CREDENTIAL.VALUE.satisfy(value.length),
            MitumError.detail(ECODE.INVALID_ITEM, "credential value length out of range"),    
        )

        Assert.check(
            validFrom < validUntil,
            MitumError.detail(ECODE.INVALID_ITEM, "valid until <= valid from")
        )
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            encoder.encode(this.value),
            this.validFrom.toBytes(),
            this.validUntil.toBytes(),
            encoder.encode(this.did),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            value: this.value,
            valid_from: this.validFrom.v,
            valid_until: this.validUntil.v,
            did: this.did,
        }
    }

    toString(): string {
        return `${super.toString()}-${this.templateID}-${this.credentialID}`
    }
}

export class IssueFact extends OperationFact<IssueItem> {
    constructor(token: string, sender: string | Address, items: IssueItem[]) {
        super(HINT.CREDENTIAL.ISSUE.FACT, token, sender, items)

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
        return HINT.CREDENTIAL.ISSUE.OPERATION
    }
}