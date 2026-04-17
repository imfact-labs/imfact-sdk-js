import { NFTItem } from "./item"
import { ItemOperationFact } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Big, HintedObject } from "../../types"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class ApproveItem extends NFTItem {
    readonly approved: Address
    readonly nftIdx: Big

    constructor(
        contract: string | Address,
        approved: string | Address,
        nftIdx: string | number | Big,
    ) {
        super(HINT.NFT.APPROVE.ITEM, contract)

        this.approved = Address.from(approved)
        this.nftIdx = Big.from(nftIdx)
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.approved.toBytes(),
            this.nftIdx.toBytes("fill"),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            approved: this.approved.toString(),
            nft_idx: this.nftIdx.v,
        }
    }

    toString(): string {
        return `${super.toString()}-${this.nftIdx.v}`
    }
}

export class ApproveFact extends ItemOperationFact<ApproveItem> {
    constructor(token: string, sender: string | Address, items: ApproveItem[], currency: string | CurrencyID) {
        super(HINT.NFT.APPROVE.FACT, token, sender, items, currency)

        Assert.check(
            new Set(items.map(it => it.toString())).size === items.length,
            MitumError.detail(ECODE.INVALID_ITEMS, "duplicate approve found in items")
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
            }
        )
    }

    get operationHint() {
        return HINT.NFT.APPROVE.OPERATION
    }
}