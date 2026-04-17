import { NFTItem } from "./item"
import { ItemOperationFact } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Big, HintedObject } from "../../types"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class TransferItem extends NFTItem {
    readonly receiver: Address
    readonly nftIdx: Big

    constructor(
        contract: string | Address,
        receiver: string | Address,
        nftIdx: string | number | Big,
    ) {
        super(HINT.NFT.TRANSFER.ITEM, contract)

        this.receiver = Address.from(receiver)
        this.nftIdx = Big.from(nftIdx)
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.receiver.toBytes(),
            this.nftIdx.toBytes("fill"),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            receiver: this.receiver.toString(),
            nft_idx: this.nftIdx.v,
        }
    }

    toString(): string {
        return `${super.toString()}-${this.nftIdx.toString()}`
    }
}

export class TransferFact extends ItemOperationFact<TransferItem> {
    constructor(token: string, sender: string | Address, items: TransferItem[], currency: string | CurrencyID) {
        super(HINT.NFT.TRANSFER.FACT, token, sender, items, currency)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicate nft found in items")
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
            }
        )
    }

    get operationHint() {
        return HINT.NFT.TRANSFER.OPERATION
    }
}