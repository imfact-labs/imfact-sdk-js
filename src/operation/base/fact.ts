import base58 from "bs58"
import { Buffer } from "buffer";

import { Item } from "./item"
import { FactJson } from "./types"
import { HINT } from "../../alias"
import { Config } from "../../node"
import { Address } from "../../key/address"
import { sha3 } from "../../utils"
import { IBuffer, IHintedObject } from "../../types"
import { CurrencyID, Hint, Token } from "../../common"
import { Assert, ECODE, MitumError } from "../../error"

export abstract class Fact implements IBuffer, IHintedObject {
    private hint: Hint
    readonly token: Token
    protected _hash: Buffer
    readonly items?: Item[]

    protected constructor(hint: string, token: string) {
        this.hint = new Hint(hint)
        this.token = new Token(token)
        this._hash = Buffer.from([])
    }

    get hash() {
        return this._hash
    }

    hashing() {
        return sha3(this.toBuffer())
    }

    toBuffer(): Buffer {
        return this.token.toBuffer()
    }

    toHintedObject(): FactJson {
        return {
            _hint: this.hint.toString(),
            hash: base58.encode(this.hash ? this.hash : []),
            token: this.token.toString()
        }
    }

    abstract get operationHint(): string
}

export abstract class OperationFact<T extends Item> extends Fact {
    readonly sender: Address
    readonly items: T[]

    protected constructor(hint: string, token: string, sender: string | Address, items: T[]) {
        super(hint, token)
        this.sender = Address.from(sender)

        Assert.check(
            Config.ITEMS_IN_FACT.satisfy(items.length),
            MitumError.detail(ECODE.INVALID_ITEMS, "length of items is out of range")
        )
        
        if (hint !== HINT.NFT.MINT.FACT) {
            Assert.check(
                new Set(items.map(i => i.toString())).size === items.length,
                MitumError.detail(ECODE.INVALID_ITEMS, "duplicate items found")
            ) 
        }

        this.items = items

        this._hash = this.hashing()
    }

    toBuffer(): Buffer {
        return Buffer.concat([
            super.toBuffer(),
            this.sender.toBuffer(),
            Buffer.concat(this.items.map((i) => i.toBuffer())),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            sender: this.sender.toString(),
            items: this.items.map(i => i.toHintedObject()),
        }
    }
}

export abstract class ContractFact extends Fact {
    readonly sender: Address
    readonly contract: Address
    readonly currency: CurrencyID

    protected constructor(hint: string, token: string, sender: string | Address, contract: string | Address, currency: string | CurrencyID) {
        super(hint, token)
        this.sender = Address.from(sender)
        this.contract = Address.from(contract)
        this.currency = CurrencyID.from(currency)

        Assert.check(
            this.sender.toString() !== this.contract.toString(),
            MitumError.detail(ECODE.INVALID_FACT, "sender is same with contract address")
        )
        // this._hash = this.hashing()
    }

    toBuffer(): Buffer {
        return Buffer.concat([
            super.toBuffer(),
            this.sender.toBuffer(),
            this.contract.toBuffer(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            sender: this.sender.toString(),
            contract: this.contract.toString(),
            currency: this.currency.toString(),
        }
    }
}

export abstract class NodeFact extends Fact {
    protected constructor(hint: string, token: string) {
        super(hint, token)
    }
}
