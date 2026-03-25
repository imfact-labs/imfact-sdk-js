import { ContractFact, FactJson } from "../base"
import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { CurrencyID, Hint } from "../../common"
import { DAOPolicy } from "./policy"
import { Assert, ECODE, MitumError } from "../../error"
import { concatBytes } from "../../utils/bytes"

const encoder = new TextEncoder();

export class UpdateModelConfigFact extends ContractFact {
    readonly option: "crypto" | "biz"
    readonly policy: DAOPolicy

    constructor(
        token: string,
        sender: string | Address,
        contract: string | Address,
        option: "crypto" | "biz",
        policy: DAOPolicy,
        currency: string | CurrencyID,
    ) {
        super(HINT.DAO.UPDATE_MODEL_CONFIG.FACT, token, sender, contract, currency)
        this.option = option
        this.policy = policy

        this.policy.proposerWhitelist.accounts.forEach(
            account => Assert.check(
                this.contract.toString() !== account.toString(),
                MitumError.detail(ECODE.INVALID_FACT, "contract is same with whitelist address")
            )
        )
        
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            super.toBytes(),
            encoder.encode(this.option),
            this.policy.toBytes(),
            this.currency.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            option: this.option,
            ...this.policy.toHintedObject(),
            _hint: new Hint(HINT.DAO.UPDATE_MODEL_CONFIG.FACT).toString()
        }
    }

    get operationHint() {
        return HINT.DAO.UPDATE_MODEL_CONFIG.OPERATION
    }
}