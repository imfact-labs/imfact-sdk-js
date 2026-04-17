import { TokenItem } from "./item"
import { ItemOperationFact } from "../base"

import { Big, HintedObject } from "../../types"
import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class TransferItem extends TokenItem {
    readonly receiver: Address

    constructor(
        contract: string | Address,
        receiver: string | Address,
        amount: string | number | Big,
    ) {
        super(HINT.TOKEN.TRANSFER.ITEM, contract, amount);

        this.receiver = Address.from(receiver);
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.receiver.toBytes(),
            this.amount.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            receiver: this.receiver.toString(),
            amount: this.amount.toString(),
        }
    }

    toString(): string {
        return `${super.toString()}-${this.receiver.toString()}`
    }
}

export class TransferFact extends ItemOperationFact<TransferItem> {
    constructor(token: string, sender: string | Address, items: TransferItem[], currency: string | CurrencyID) {
        super(HINT.TOKEN.TRANSFER.FACT, token, sender, items, currency)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicated receiver found in items")
        )

        this.items.forEach(
            it => {
                Assert.check(
                    this.sender.toString() != it.contract.toString(),
                    MitumError.detail(ECODE.INVALID_ITEMS, "sender is same with contract address"),
                )
                Assert.check(
                    it.receiver.toString() !== this.sender.toString(),
                    MitumError.detail(ECODE.INVALID_FACT, "receiver is same with sender address"),
                )
                Assert.check(
                    it.receiver.toString() != it.contract.toString(),
                    MitumError.detail(ECODE.INVALID_ITEMS, "receiver is same with contract address"),
                )
                Assert.check(
                    it.amount.compare(0) >= 0,
                    MitumError.detail(ECODE.INVALID_FACT, "amount must not be under zero"),
                )
            }
        )
    }

    get operationHint() {
        return HINT.TOKEN.TRANSFER.OPERATION
    }
}