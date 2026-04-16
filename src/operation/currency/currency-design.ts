import { HINT } from "../../alias"
import { Address } from "../../key/address"
import { Hint, CurrencyID } from "../../common"
import { Big, HintedObject, IBytes, IHintedObject } from "../../types"
import { concatBytes } from "../../utils/bytes"

export class CurrencyDesign implements IBytes, IHintedObject {
    private static hint: Hint = new Hint(HINT.CURRENCY.DESIGN)
    readonly initialSupply: Big
    readonly currencyID: CurrencyID
    readonly policy: CurrencyPolicy
    readonly genesisAccount: Address
    readonly totalSupply: Big
    readonly decimal: Big

    constructor(
        initialSupply: string | number | Big,
        currencyID: string | CurrencyID,
        genesisAccount: string | Address,
        decimal: string | number | Big,
        policy: CurrencyPolicy
    ) {
        this.initialSupply = Big.from(initialSupply)
        this.currencyID = CurrencyID.from(currencyID)
        this.genesisAccount = Address.from(genesisAccount)
        this.policy = policy
        this.totalSupply = Big.from(initialSupply)
        this.decimal = Big.from(decimal)
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.initialSupply.toBytes(), 
            this.currencyID.toBytes(),
            this.decimal.toBytes(),
            this.genesisAccount.toBytes(),
            this.policy.toBytes(),
            this.totalSupply.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            _hint: CurrencyDesign.hint.toString(),
            currency_id: this.currencyID.toString(),
            decimal: this.decimal.toString(),
            genesis_account: this.genesisAccount.toString(),
            initial_supply: this.initialSupply.toString(),
            policy: this.policy.toHintedObject(),
            total_supply: this.totalSupply.toString(),
        }
    }
}

export class CurrencyPolicy implements IBytes, IHintedObject {
    private static hint: Hint = new Hint(HINT.CURRENCY.POLICY)
    readonly newAccountMinBalance: Big
    readonly feeer: Feeer

    constructor(newAccountMinBalance: string | number | Big, feeer: Feeer) {
        this.newAccountMinBalance = Big.from(newAccountMinBalance)
        this.feeer = feeer
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.newAccountMinBalance.toBytes(),
            this.feeer.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            _hint: CurrencyPolicy.hint.toString(),
            feeer: this.feeer.toHintedObject(),
            min_balance: this.newAccountMinBalance.toString(),
        }
    }
}

abstract class Feeer implements IBytes, IHintedObject {
    private hint: Hint

    constructor(hint: string) {
        this.hint = new Hint(hint)
    }

    abstract toBytes(): Uint8Array

    toHintedObject(): HintedObject {
        return {
            _hint: this.hint.toString()
        }
    }
}

export class NilFeeer extends Feeer {
    constructor() {
        super(HINT.CURRENCY.FEEER.NIL)
    }

    toBytes(): Uint8Array {
        return new Uint8Array()
    }
}

export class FixedFeeer extends Feeer {
    readonly receiver: Address
    readonly amount: Big

    constructor(receiver: string | Address, amount: string | number | Big) {
        super(HINT.CURRENCY.FEEER.FIXED)
        this.receiver = Address.from(receiver)
        this.amount = Big.from(amount)
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.receiver.toBytes(), 
            this.amount.toBytes(), 
        ])
    }

    toHintedObject(): HintedObject {
        const feeer = {
            ...super.toHintedObject(),
            amount: this.amount.toString(),
            receiver: this.receiver.toString(),
        }

        return feeer
    }
}

export class FixedItemFeeer extends Feeer {
    readonly receiver: Address
    readonly amount: Big
    readonly item_fee_amount: Big

    constructor(receiver: string | Address, amount: string | number | Big, item_fee_amount: string | number | Big) {
        super(HINT.CURRENCY.FEEER.FIXED_ITEM)
        this.receiver = Address.from(receiver)
        this.amount = Big.from(amount)
        this.item_fee_amount = Big.from(item_fee_amount)
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.receiver.toBytes(), 
            this.amount.toBytes(),
            this.item_fee_amount.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        const feeer = {
            ...super.toHintedObject(),
            receiver: this.receiver.toString(),
            amount: this.amount.toString(),
            item_fee_amount: this.item_fee_amount.toString(),
        }

        return feeer
    }
}

export class FixedDetailedFeeer extends Feeer {
    readonly receiver: Address
    readonly amount: Big
    readonly item_fee_amount: Big
    readonly data_size_fee_amount: Big
    readonly data_size_unit: Big
    readonly execution_fee_amount: Big


    constructor(
        receiver: string | Address, 
        amount: string | number | Big, 
        item_fee_amount: string | number | Big,
        data_size_fee_amount: string | number | Big,
        data_size_unit: string | number | Big,
        execution_fee_amount: string | number | Big,
    ) {
        super(HINT.CURRENCY.FEEER.FIXED_DETAILED)
        this.receiver = Address.from(receiver)
        this.amount = Big.from(amount)
        this.item_fee_amount = Big.from(item_fee_amount)
        this.data_size_fee_amount = Big.from(data_size_fee_amount)
        this.data_size_unit = Big.from(data_size_unit)
        this.execution_fee_amount = Big.from(execution_fee_amount)
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.receiver.toBytes(), 
            this.amount.toBytes(),
            this.item_fee_amount.toBytes(),
            this.data_size_fee_amount.toBytes(),
            this.data_size_unit.toBytes(),
            this.execution_fee_amount.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        const feeer = {
            ...super.toHintedObject(),
            receiver: this.receiver.toString(),
            amount: this.amount.toString(),
            item_fee_amount: this.item_fee_amount.toString(),
            data_size_fee_amount: this.item_fee_amount.toString(),
            data_size_unit: this.item_fee_amount.toString(),
            execution_fee_amount: this.item_fee_amount.toString(),
        }

        return feeer
    }
}