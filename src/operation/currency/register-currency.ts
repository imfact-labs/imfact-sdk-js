import { CurrencyDesign } from "./currency-design"
import { NodeFact, FactJson } from "../base"
import { HINT } from "../../alias"
import { concatBytes } from "../../utils/bytes"

export class RegisterCurrencyFact extends NodeFact {
    readonly design: CurrencyDesign

    constructor(token: string, design: CurrencyDesign) {
        super(HINT.CURRENCY.REGISTER_CURRENCY.FACT, token)
        this.design = design
        this._hash = this.hashing()
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.token.toBytes(),
            this.design.toBytes(),
        ])
    }

    toHintedObject(): FactJson {
        return {
            ...super.toHintedObject(),
            currency: this.design.toHintedObject(),
        }
    }

    get operationHint() {
        return HINT.CURRENCY.REGISTER_CURRENCY.OPERATION
    }
}