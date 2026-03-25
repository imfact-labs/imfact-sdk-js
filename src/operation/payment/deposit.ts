import { FactJson } from "../base"
import { PaymentFact } from "./fact"
import { Big } from "../../types"
import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID } from "../../common"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

export class DepositFact extends PaymentFact {
    readonly amount: Big;
    readonly transfer_limit: Big;
    readonly start_time: Big;
    readonly end_time: Big;
    readonly duration: Big;

    constructor(
        token: string,
        sender: string | Address,
        contract: string | Address,
        currency: string | CurrencyID,
        amount: string | number,
        transfer_limit: string | number,
        start_time: string | number,
        end_time: string | number,
        duration: string | number
    ) {
        super(HINT.PAYMENT.DEPOSIT.FACT, token, sender, contract, currency)
        this.amount = Big.from(amount);
        this.transfer_limit = Big.from(transfer_limit);
        this.start_time = Big.from(start_time);
        this.end_time = Big.from(end_time);
        this.duration = Big.from(duration);


        Assert.check(
            this.amount.overZero(),
            MitumError.detail(ECODE.INVALID_FACT, "amount must be greater 0"),
        )

        Assert.check(
            this.start_time.v < this.end_time.v,
            MitumError.detail(ECODE.INVALID_FACT, "end_time must be greater than start_time"),
        )

        Assert.check(
            this.duration.v < this.end_time.v - this.start_time.v,
            MitumError.detail(ECODE.INVALID_FACT, "duration must be less than (end_time - start_time)"),
        )
  
        this._hash = this.hashing();
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            this.amount.toBytes(),
            this.transfer_limit.toBytes(),
            this.start_time.toBytes("fill"),
            this.end_time.toBytes("fill"),
            this.duration.toBytes("fill"),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            amount: this.amount.toString(),
            transfer_limit: this.transfer_limit.toString(),
            start_time: this.start_time.v,
            end_time: this.end_time.v,
            duration: this.duration.v,
        }
    }

    get operationHint() {
        return HINT.PAYMENT.DEPOSIT.OPERATION
    }
}