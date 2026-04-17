import { TokenItem } from "./item"
import { ItemOperationFact } from "../base"

import { Big, HintedObject } from "../../types"
import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class TransferFromItem extends TokenItem {
    readonly receiver: Address
    readonly target: Address

    constructor(
        contract: string | Address,
        receiver: string | Address,
        target: string | Address,
        amount: string | number | Big,
    ) {
        super(HINT.TOKEN.TRANSFER_FROM.ITEM, contract, amount);

        this.receiver = Address.from(receiver);
        this.target = Address.from(target);
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.receiver.toBytes(),
            this.target.toBytes(),
            this.amount.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            receiver: this.receiver.toString(),
            target: this.target.toString(),
            amount: this.amount.toString(),
        }
    }

    toString(): string {
        return `${super.toString()}-${this.receiver.toString()}-${this.target.toString()}`
    }
}

export class TransferFromFact extends ItemOperationFact<TransferFromItem> {
    constructor(token: string, sender: string | Address, items: TransferFromItem[], currency: string | CurrencyID) {
        super(HINT.TOKEN.TRANSFER_FROM.FACT, token, sender, items, currency)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicated target-receiver pair found in items")
        )

        this.items.forEach(
            it => {
                Assert.check(
                    this.sender.toString() != it.contract.toString(),
                    MitumError.detail(ECODE.INVALID_ITEMS, "sender is same with contract address"),
                )
                Assert.check(
                    it.receiver.toString() != it.contract.toString(),
                    MitumError.detail(ECODE.INVALID_ITEMS, "receiver is same with contract address"),
                )
                Assert.check(
                    it.target.toString() != it.contract.toString(),
                    MitumError.detail(ECODE.INVALID_ITEMS, "target is same with contract address"),
                )
                Assert.check(
                    it.receiver.toString() != it.target.toString(),
                    MitumError.detail(ECODE.INVALID_ITEMS, "target is same with receiver address"),
                )
                Assert.check(
                    this.sender.toString() != it.target.toString(),
                    MitumError.detail(ECODE.INVALID_ITEMS, "target is same with sender address, use 'transfer' instead")
                )
                Assert.check(
                    it.amount.compare(0) >= 0,
                    MitumError.detail(ECODE.INVALID_ITEMS, "amount must not be under zero"),
                )
            }
        )
    }

    get operationHint() {
        return HINT.TOKEN.TRANSFER_FROM.OPERATION
    }
}