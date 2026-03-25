import { PaymentFact } from "./fact"
import { FactJson } from "../base"
import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Big } from "../../types"
import { concatBytes } from "../../utils/bytes"

export class TransferFact extends PaymentFact {
    readonly amount: Big;
    readonly receiver: Address;

    constructor(
        token: string, 
        sender: string | Address, 
        contract: string | Address, 
        currency: string | CurrencyID,
        receiver: string | Address,
        amount: string | number
    ) {
        super(HINT.PAYMENT.TRANSFER.FACT, token, sender, contract, currency);
        this.amount = Big.from(amount);
        this.receiver = Address.from(receiver);

        this._hash = this.hashing();
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.receiver.toBytes(),
            this.amount.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            receiver: this.receiver.toString(),
            amount: this.amount.toString(),
        }
    }

    get operationHint() {
        return HINT.PAYMENT.TRANSFER.OPERATION
    }
}