import { TokenItem } from "./item"
import { ItemOperationFact } from "../base"

import { Big, HintedObject } from "../../types"
import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class ApproveItem extends TokenItem {
    readonly approved: Address

    constructor(
        contract: string | Address,
        approved: string | Address,
        amount: string | number | Big,
    ) {
        super(HINT.TOKEN.APPROVE.ITEM, contract, amount);

        this.approved = Address.from(approved);
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.approved.toBytes(),
            this.amount.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            approved: this.approved.toString(),
            amount: this.amount.toString(),
        }
    }

    toString(): string {
        return `${super.toString()}-${this.approved.toString()}`
    }
}

export class ApproveFact extends ItemOperationFact<ApproveItem> {
    constructor(token: string, sender: string | Address, items: ApproveItem[], currency: string | CurrencyID) {
        super(HINT.TOKEN.APPROVE.FACT, token, sender, items, currency)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicated approve found in items")
        )

        this.items.forEach(
            it => {
                Assert.check(
                    this.sender.toString() != it.contract.toString(),
                    MitumError.detail(ECODE.INVALID_ITEMS, "sender is same with contract address"),
                )
                Assert.check(
                    it.approved.toString() != it.contract.toString(),
                    MitumError.detail(ECODE.INVALID_ITEMS, "approved is same with contract address"),
                )
                Assert.check(
                    it.amount.compare(0) >= 0,
                    MitumError.detail(ECODE.INVALID_FACT, "amount must not be under zero"),
                )
            }
        )
    }

    get operationHint() {
        return HINT.TOKEN.APPROVE.OPERATION
    }
}