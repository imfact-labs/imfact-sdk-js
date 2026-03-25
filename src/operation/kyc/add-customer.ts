import { KYCItem } from "./item"
import { OperationFact } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Bool, HintedObject } from "../../types"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class AddCustomerItem extends KYCItem {
    readonly customer: Address
    readonly status: Bool

    constructor(
        contract: string | Address,
        customer: string | Address,
        status: boolean | Bool,
        currency: string | CurrencyID,
    ) {
        super(HINT.KYC.ADD_CUSTOMER.ITEM, contract, currency)

        this.customer = Address.from(customer)
        this.status = Bool.from(status)

        Assert.check(
            this.contract.toString() !== this.customer.toString(),
            MitumError.detail(ECODE.INVALID_ITEM, "contract is same with customer address")
        )
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.customer.toBytes(),
            this.status.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            customer: this.customer.toString(),
            status: this.status.v,
        }
    }

    toString(): string {
        return `${super.toString()}-${this.customer.toString()}`
    }
}

export class AddCustomerFact extends OperationFact<AddCustomerItem> {
    constructor(token: string, sender: string | Address, items: AddCustomerItem[]) {
        super(HINT.KYC.ADD_CUSTOMER.FACT, token, sender, items)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicate customer found in items")
        )
    }

    get operationHint() {
        return HINT.KYC.ADD_CUSTOMER.OPERATION
    }
}