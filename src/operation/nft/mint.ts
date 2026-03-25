import { NFTItem } from "./item"
import { Signers } from "./signer"
import { OperationFact } from "../base"

import { HINT } from "../../alias"
import { Address } from "../../key/address"
import type { CurrencyID } from "../../common"
import type { HintedObject } from "../../types"
import { LongString } from "../../types"
import { Assert, ECODE, MitumError } from "../../error"
import { Config } from "../../node"
import { concatBytes } from "../../utils/bytes"

export class MintItem extends NFTItem {
    readonly receiver: Address
    readonly hash: LongString
    readonly uri: LongString
    readonly creators: Signers

    constructor(
        contract: string | Address,
        receiver: string | Address,
        hash: string | LongString, 
        uri: string | LongString,
        creators: Signers,
        currency: string | CurrencyID,
    ) {
        super(HINT.NFT.MINT.ITEM, contract, currency)

        Assert.check(
            Config.NFT.HASH.satisfy(hash.toString().length),
            MitumError.detail(ECODE.INVALID_LENGTH, "hash length is out of range")
        );
        Assert.check(
            Config.NFT.URI.satisfy(uri.toString().length),
            MitumError.detail(ECODE.INVALID_LENGTH, "uri length is out of range")
        );

        this.receiver = Address.from(receiver)
        this.hash = LongString.from(hash)
        this.uri = LongString.from(uri)
        this.creators = creators
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.receiver.toBytes(),
            this.hash.toBytes(),
            this.uri.toBytes(),
            this.creators.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            receiver: this.receiver.toString(),
            hash: this.hash.toString(),
            uri: this.uri.toString(),
            creators: this.creators.toHintedObject(),
        }
    }
}

export class MintFact extends OperationFact<MintItem> {
    constructor(token: string, sender: string | Address, items: MintItem[]) {
        super(HINT.NFT.MINT.FACT, token, sender, items)

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
                it.creators.signers.forEach(
                    signer => {
                        Assert.check(
                            signer.account.toString() != it.contract.toString(),
                            MitumError.detail(ECODE.INVALID_ITEMS, "creator is same with contract address"),
                        )
                    }
                )
            }
        )
    }

    get operationHint() {
        return HINT.NFT.MINT.OPERATION
    }
}