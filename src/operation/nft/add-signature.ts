import { NFTItem } from "./item"
import { OperationFact } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Big, HintedObject } from "../../types"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class AddSignatureItem extends NFTItem {
    readonly nftIdx: Big

    constructor(
        contract: string | Address, 
        nftIdx: string | number | Big, 
        currency: string | CurrencyID,
    ) {
        super(HINT.NFT.ADD_SIGNATURE.ITEM, contract, currency)
        this.nftIdx = Big.from(nftIdx)
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.nftIdx.toBytes("fill"),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            nft_idx: this.nftIdx.v,
        }
    }
}

export class AddSignatureFact extends OperationFact<AddSignatureItem> {
    constructor(token: string, sender: string | Address, items: AddSignatureItem[]) {
        super(HINT.NFT.ADD_SIGNATURE.FACT, token, sender, items)

        this.items.forEach(
            it => Assert.check(
                this.sender.toString() != it.contract.toString(),
                MitumError.detail(ECODE.INVALID_ITEMS, "sender is same with contract address"),
            )
        )
    }

    get operationHint() {
        return HINT.NFT.ADD_SIGNATURE.OPERATION
    }
}