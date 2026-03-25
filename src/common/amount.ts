import { Hint } from "./hint"
import { CurrencyID } from "./id"
import { concatBytes } from "../utils/bytes"
import { HINT } from "../alias"
import { Assert, ECODE, MitumError } from "../error"
import { Big, HintedObject, IBytes, IHintedObject } from "../types"

export class Amount implements IBytes, IHintedObject {
  private hint: Hint
  readonly currency: CurrencyID
  readonly big: Big

  constructor(currency: string | CurrencyID, big: string | number | Big) {
    this.hint = new Hint(HINT.CURRENCY.AMOUNT)
    this.currency = CurrencyID.from(currency)
    this.big = Big.from(big)

    Assert.check(
      this.big.big > 0,
      MitumError.detail(ECODE.INVALID_AMOUNT, "amount must be over zero")
    )
  }

  toBytes(): Uint8Array {
    return concatBytes([
      this.big.toBytes(),
      this.currency.toBytes(),
    ])
  }

  toHintedObject(): HintedObject {
    return {
      _hint: this.hint.toString(),
      currency: this.currency.toString(),
      amount: this.big.toString(),
    }
  }
}

export class Fee implements IBytes, IHintedObject {
  private hint: Hint
  readonly currency: CurrencyID
  readonly big: Big

  constructor(currency: string | CurrencyID, big: string | number | Big) {
    this.hint = new Hint(HINT.CURRENCY.AMOUNT)
    this.currency = CurrencyID.from(currency)
    this.big = Big.from(big)

    Assert.check(
      0 <= this.big.big,
      MitumError.detail(ECODE.INVALID_FACT, "fee must not be under zero")
    )
  }

  toBytes(): Uint8Array {
    return concatBytes([
      this.big.toBytes(),
      this.currency.toBytes(),
    ])
  }

  toHintedObject(): HintedObject {
    return {
      _hint: this.hint.toString(),
      currency: this.currency.toString(),
      amount: this.big.toString(),
    }
  }
}