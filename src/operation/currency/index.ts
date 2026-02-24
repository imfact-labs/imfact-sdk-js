import { CreateAccountItem, CreateAccountFact } from "./create-account"
import { UpdateKeyFact } from "./update-key"
import { TransferItem, TransferFact } from "./transfer"
import { CreateContractAccountItem, CreateContractAccountFact } from "./create-contract-account"
import { WithdrawItem, WithdrawFact } from "./withdraw"
import { UpdateHandlerFact } from "./update-handler"
import { RegisterCurrencyFact } from "./register-currency"
import { UpdateCurrencyFact } from "./update-currency"
import { MintFact } from "./mint"

import { CurrencyDesign, CurrencyPolicy, NilFeeer, FixedFeeer, RatioFeeer } from "./currency-design"

import { BaseOperation } from "../base"
import { Operation } from "../api"
import { operationApi, accountApi, currencyApi } from "../../api"
import { getAPIData } from "../../api/getAPIData"
import { Amount, CurrencyID } from "../../common"
import { Big, Generator, IP, TimeStamp } from "../../types"
import { KeyG } from "../../key"
import { Address } from "../../key/address"
import type { Account as AccountType } from "../../key/types"
import { Keys, Key, PubKey } from "../../key/pub"
import { KeyPair } from "../../key/keypair"

import { StringAssert, Assert, ArrayAssert, ECODE, MitumError } from "../../error"
import { isSuccessResponse } from "../../utils"
import { Config } from "../../node"
import { SUFFIX } from "../../alias"

type currencyPolicyData = {
    minBalance: string | number | Big
    feeType: "nil" | "fixed" | "ratio"
    feeReceiver: string | Address
    fee?: string | number | Big
    ratio?: number
    minFee?: string | number | Big
    maxFee?: string | number | Big
}

type keysType =
    ({ key: string | Key | PubKey, weight: string | number | Big } | PubKey)[]
    | Array<{ key: string | Key | PubKey; weight: string | number | Big }>

export class Currency extends Generator {
    constructor(
        networkID: string,
        api?: string | IP,
        delegateIP?: string | IP,
    ) {
        super(networkID, api, delegateIP)
    }

    /**
     * Generate a `register-currency` operation for registering a new currency.
     * **Signature of nodes** is required, not a general account signature.
     * @param {string | Address} [genesisAddress] - genesis account's address.
     * @param {string | number | Big} [initialSupply] - initial supply amount.
     * @param {string | CurrencyID} [currencyID] - currency ID to resgister.
     * @param {string | number | Big} [decimal] - decimal number for the currency.
     * @param {currencyPolicyData} [data] - The currency policy data.
     * @returns `register-currency` operation.
     */
    registerCurrency(
        genesisAddress: string | Address, 
        initialSupply: string | number | Big,
        currencyID: string | CurrencyID,
        decimal: string | number | Big,
        data: currencyPolicyData
    ) {
        Address.from(genesisAddress);
        const keysToCheck: (keyof currencyPolicyData)[] = ['minBalance', 'feeType', 'feeReceiver'];
        keysToCheck.forEach((key) => {
            Assert.check(data[key] !== undefined, 
            MitumError.detail(ECODE.INVALID_DATA_STRUCTURE, `${key} is undefined, check the currencyPolicyData structure`))
        });

        const design = new CurrencyDesign(
            initialSupply,
            currencyID,
            genesisAddress,
            decimal,
            this.buildPolicy(
                data.feeType,
                data.minBalance,
                data.feeReceiver,
                data.fee,
                data.ratio,
                data.minFee,
                data.maxFee,
            ),
        )
                
        return new BaseOperation(
            this.networkID,
            new RegisterCurrencyFact(TimeStamp.new().UTC(), design),
        ) 
    }
    
    /**
     * Generate an `update-currency` operation for updating an existing Mitum currency.
     * **Signature of nodes** is required, not a general account signature.
     * @param {string | CurrencyID} [currency] - The currency ID to want to updated.
     * @param {currencyPolicyData} [data] - The currency policy data.
     * @returns `update-currency` operation.
     */
    updateCurrency(currency: string | CurrencyID, data: currencyPolicyData) {
        const keysToCheck: (keyof currencyPolicyData)[] = ['minBalance', 'feeType', 'feeReceiver'];
        keysToCheck.forEach((key) => {
            Assert.check(data[key] !== undefined, 
            MitumError.detail(ECODE.INVALID_DATA_STRUCTURE, `${key} is undefined, check the currencyPolicyData structure`))
        });

        return new BaseOperation(
            this.networkID,
            new UpdateCurrencyFact(
                TimeStamp.new().UTC(),
                currency,
                this.buildPolicy(
                    data.feeType,
                    data.minBalance,
                    data.feeReceiver,
                    data.fee,
                    data.ratio,
                    data.minFee,
                    data.maxFee,
                ),
            ),
        )
    }

    private buildPolicy(
        feeType: "nil" | "fixed" | "ratio",
        minBalance: string | number | Big,
        receiver: string | Address,
        fee?: string | number | Big,
        ratio?: number,
        min?: string | number | Big,
        max?: string | number | Big,
    ): CurrencyPolicy {
        Address.from(receiver);
        switch (feeType) {
            case "nil":
                return new CurrencyPolicy(minBalance, new NilFeeer())
            case "fixed":
                Assert.check(
                    fee !== undefined,
                    MitumError.detail(ECODE.CURRENCY.INVALID_CURRENCY_FEEER, "no fee")
                )
                return new CurrencyPolicy(minBalance, new FixedFeeer(receiver, fee!))
            case "ratio":
                Assert.check(
                    ratio !== undefined,
                    MitumError.detail(ECODE.CURRENCY.INVALID_CURRENCY_FEEER, "no ratio")
                )
                Assert.check(
                    min !== undefined,
                    MitumError.detail(ECODE.CURRENCY.INVALID_CURRENCY_FEEER, "no min fee")
                )
                Assert.check(
                    max !== undefined,
                    MitumError.detail(ECODE.CURRENCY.INVALID_CURRENCY_FEEER, "no max fee")
                )
                return new CurrencyPolicy(
                    minBalance,
                    new RatioFeeer(receiver, ratio!, min!, max!),
                )
            default:
                throw MitumError.detail(ECODE.CURRENCY.INVALID_CURRENCY_FEEER, "invalid fee type")
        }
    }

    /**
     * Generate a `transfer` operation for transferring currency between accounts.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | Address} [receiver] - The receiver's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | number | Big} [amount] - The amount to transfer.
     * @returns `transfer` operation.
     */
    transfer(
        sender: string | Address,
        receiver: string | Address,
        currency: string | CurrencyID,
        amount: string | number | Big,
    ) {
        return new BaseOperation(
            this.networkID,
            new TransferFact(
                TimeStamp.new().UTC(),
                sender,
                [
                    new TransferItem(receiver, [new Amount(currency, amount)])
                ],
            ),
        )
    }

    /**
     * Generate a `transfer` operation for transferring currency to multiple accounts at once.
     * The length of receivers and amounts must be the same.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string[] | Address[]} [receivers] - An array of addresses of receivers.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string[] | number[] | Big[]} [amounts] - An array of amounts to transfer.
     * @returns `transfer` operation.
     */
    batchTransfer(
        sender: string | Address,
        receivers: string[] | Address[],
        currency: string | CurrencyID,
        amounts: string[] | number[] | Big[],
    ) {
        ArrayAssert.check(receivers, "receivers").rangeLength(Config.ITEMS_IN_FACT).noDuplicates().sameLength(amounts, "amounts");
        return new BaseOperation(
            this.networkID,
            new TransferFact(
                TimeStamp.new().UTC(),
                sender,
                receivers.map((receiver, idx) => new TransferItem(
                    receiver, [new Amount(currency, amounts[idx])]
                    )
                ),
            ),
        )
    }

    /**
     * Generate a `withdraw`operation for withdrawing currency from an contract account.
     * Only the owner account of the contract can execute the operation.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | Address} [target] - The target contract account's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | number | Big} [amount] - The withdrawal amount.
     * @returns `withdraw`operation
     */
    withdraw(
        sender: string | Address,
        target: string | Address,
        currency: string | CurrencyID,
        amount: string | number | Big,
    ) {
        return new BaseOperation(
            this.networkID,
            new WithdrawFact(
                TimeStamp.new().UTC(),
                sender,
                [
                    new WithdrawItem(target, [new Amount(currency, amount)])
                ],
            ),
        )
    }

    /**
     * Generate a `withdraw` operation with multiple items for withdrawing currency from multiple contract accounts.
     * Only the owner account of the contract can execute the operation.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string[] | Address[]} [targets] - The array of target contract account's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | number | Big} [amounts] - The array of withdrawal amount.
     * @returns `withdraw`operation
     */
    multiWithdraw(
        sender: string | Address,
        targets: string[] | Address[],
        currency: string | CurrencyID,
        amounts: string[] | number[] | Big[],
    ) { 
        ArrayAssert.check(targets, "targets").rangeLength(Config.ITEMS_IN_FACT).sameLength(amounts, "amounts");
        const items = targets.map((el, idx) => { return new WithdrawItem(el, [new Amount(currency, amounts[idx])])});
        return new BaseOperation(
            this.networkID,
            new WithdrawFact(
                TimeStamp.new().UTC(),
                sender,                
                items,
            ),
        )
    }

    /**
     * Generate a `mint` operation for minting currency and allocating it to a receiver.
     * **Signature of nodes** is required, not a general account signature.
     * @param {string | Address} [receiver] - The receiver's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {number} [amount] - The amount to mint.
     * @returns `mint` operation.
     */
    mint(
        receiver: string | Address,
        currency: string | CurrencyID,
        amount: number
    ) {
        return new BaseOperation(
            this.networkID,
            new MintFact(
                TimeStamp.new().UTC(),
                receiver, new Amount(currency, amount),
            ),
        )
    }

    /**
     * Get a list of all currency in the blockchain network.
     * @async
     * @returns `data` of `SuccessResponse` is a array with currency id.
     */
    async getAllCurrencies(): Promise<any> {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        const response = await getAPIData(() => currencyApi.getCurrencies(this.api, this.delegateIP), true);

        if (isSuccessResponse(response) && response.data) {
            response.data = response.data._links ?
            Object.keys(response.data._links)
                .filter(c => !(c === "self" || c === "currency:{currencyid}"))
                .map(c => c)
            : null;
        }
        return response
    }

    /**
     * Get currency information abount given currency ID.
     * @async
     * @param {string | CurrencyID} [currencyID] - The currency ID.
     * @returns `data` of `SuccessResponse` is currency information:
     * - `_hint`: Hint for currency design
     * - `initial_supply`: [Amount]
     * - `genesis_account`: Initial account for the currency.
     * - `policy`: Currency policy information including `min_balance`, `feeer`
     * - `total_supply`: Total supply amount of the currency.
     */
    async getCurrency(currencyID: string | CurrencyID) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        return await getAPIData(() => currencyApi.getCurrency(this.api, currencyID, this.delegateIP))
    }
}

export class Account extends KeyG {
    constructor(
        networkID: string,
        api?: string | IP,
        delegateIP?: string | IP,
    ) {
        super(networkID, api, delegateIP)
    }

    /**
     * Generate a key pair and the corresponding `transfer` operation to create a single-sig account. Avoid using seed ​​that are easy to predict.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | number | Big} [amount] - The initial amount. (to be paid by the sender)
     * @param {string} [seed] - (Optional) The seed for deterministic key generation. If not provided, a random key pair will be generated.
     * @param {string | number | Big} [weight] - (Optional) The weight for the public key. If not provided, the default value is 100.
     * @returns An object containing the wallet(key pair) and the `transfer` operation.
     */
    createWallet(
        sender: string | Address,
        currency: string | CurrencyID,
        amount: string | number | Big,
        seed?: string,
        weight?: string | number | Big,
    ): { wallet: AccountType, operation: BaseOperation<TransferFact> } {
        const kp = seed ? KeyPair.fromSeed(seed, "mitum") : KeyPair.random("mitum")
        const ks = new Keys([new PubKey(kp.publicKey, weight ?? 100)], weight ?? 100)

        return {
            wallet: {
                privatekey: kp.privateKey.toString(),
                publickey: kp.publicKey.toString(),
                address: ks.checksum.toString()
            },
            operation: new BaseOperation(
                this.networkID,
                new TransferFact(
                    TimeStamp.new().UTC(),
                    sender,
                    [
                        new TransferItem(
                            ks.checksum,
                            [new Amount(currency, amount)],
                        )
                    ],
                ),
            ),
        }
    }

    /**
     * Generate `n` number of key pairs and the corresponding `transfer` operation to create single-sig accounts.
     * @param {string | Address} [sender] - The sender's address.
     * @param {number} [n] - The number of account to create.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | number | Big} [amount] - The initial amount. (to be paid by the sender)
     * @returns An object containing the wallet (key pairs) and the `transfer` operation.
     */
    createBatchWallet(
        sender: string | Address,
        n: number,
        currency: string | CurrencyID,
        amount: string | number | Big,
    ): { wallet: AccountType[], operation: BaseOperation<TransferFact> } {
        const keyArray = this.keys(n);
        const items = keyArray.map((ks) => new TransferItem(ks.address,[new Amount(currency, amount)]));
        return {
            wallet: keyArray,
            operation: new BaseOperation(
                this.networkID,
                new TransferFact(
                    TimeStamp.new().UTC(),
                    sender,
                    items,
                ),
            ),
        }
    }

    /**
     * Generate a `transfer` operation for the given public key.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | Key | PubKey} [key] - The public key or key object.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | number | Big} [amount] - The initial amount. (to be paid by the sender)
     * @returns `transfer` operation.
     */
    createAccount(
        sender: string | Address,
        key: string | Key | PubKey,
        currency: string | CurrencyID,
        amount: string | number | Big,
    ) {
        const ks = new Keys([new PubKey(key, 100)], 100);
        return new BaseOperation(
            this.networkID,
            new TransferFact(
                TimeStamp.new().UTC(),
                sender,
                [
                    new TransferItem(
                        ks.checksum,
                        [new Amount(currency, amount)],
                    )
                ],
            )
        )
    }

    /**
     * Generate a `create-account` operation for the multi-signature account.
     * @param {string | Address} [sender] - The sender's address.
     * @param {keysType} [keys] - An array of object {`key`: publickey, `weight`: weight for the key}
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | number | Big} [amount] - The initial amount. (to be paid by the sender)
     * @param {string | number | Big} [threshold] - The threshold for the multi-signature.
     * @returns `create-account` operation.
     * @example
     * // Example of parameter keys
     * const pubkey01 = {
     *     key: "02cb1d73c49d638d98092e35603414b575f3f5b5ce01162cdd80ab68ab77e50e14fpu",
     *     weight: 50
     * };
     * const pubkey02 = {
     *     key: "0377241675aabafca6b1a49f3bc08a581beb0daa330a4ac2008464d63ed7635a22fpu",
     *     weight: 50
     * };
     * const keysArray = [pubkey01, pubkey02];
     */
    createMultiSig(
        sender: string | Address,
        keys: keysType,
        currency: string | CurrencyID,
        amount: string | number | Big,
        threshold: string | number | Big,
    ) {
        return new BaseOperation(
            this.networkID,
            new CreateAccountFact(
                TimeStamp.new().UTC(),
                sender,
                [
                    new CreateAccountItem(
                        new Keys(
                            keys.map(k =>
                                k instanceof PubKey ? k : new PubKey(k.key, k.weight)
                            ),
                            threshold,
                        ),
                        [new Amount(currency, amount)],
                    )
                ]
            ),
        )
    }

    /**
     * Generate an `update-key` operation for replace the public keys involved in given address.
     * 
     * `update-key` cannot be used for single-sig accounts and CA accounts.
     * @param {string | Address} [sender] - The target account's address.
     * @param {keysType} [newKeys] - An array of object {`key`: publickey, `weight`: weight for the key}
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @returns `update-key` operation.
     * @example
     * // Example of parameter keys
     * const pubkey01 = {
     *     key: "02a2e69d8b819e25ac4931523b62995bf3361304093dc24f15658d88e72644d853fpu",
     *     weight: 50
     * };
     * const pubkey02 = {
     *     key: "03410a28d1d44974f3af2b12f6d23733a17ea30e2ecfbc413055a4543b28f16f45fpu",
     *     weight: 50
     * };
     * const keysArray = [pubkey01, pubkey02];
     */
    updateKey(
        sender: string | Address,
        newKeys: keysType,
        currency: string | CurrencyID,
        threshold: string | number | Big,
    ) {
        return new BaseOperation(
            this.networkID,
            new UpdateKeyFact(
                TimeStamp.new().UTC(),
                sender,
                new Keys(
                    newKeys.map(k =>
                        k instanceof PubKey ? k : new PubKey(k.key, k.weight)
                    ),
                    threshold,
                ),
                currency,
            ),
        )
    }

    /**
     * Sign and send the `transfer` operation to blockchain network to create single-sig account.
     * @async
     * @param {string | Key} [privatekey] - The private key used for signing.
     * @param {Object} [wallet] - The object with properties `wallet` and `operation`. (return value of `createWallet`)
     * @returns A Promise resolving to a `OperationResponse`. `.wait()` can be used like `operation.send`.
     * 
     * Properties of `OperationResponse`:
     * - response: <SuccessResponse | ErrorResponse>
     * - _api: API URL
     * - _delegateIP: IP address for delegation
     * @example
     * // Send operation and check response and receipt:
     * const wallet = mitum.account.createWallet(...);
     * const touchOperation = async () => {
     *   const data = await mitum.account.touch(privatekey, wallet);
     *   console.log(data.response);
     *   const receipt = await data.wait();
     *   console.log(receipt);
     * };
     * touchOperation();
     */
    async touch(
        privatekey: string | Key,
        wallet: { wallet: AccountType | AccountType[], operation: BaseOperation<TransferFact> }
    ) {
        const op = wallet.operation;
        op.sign(privatekey);

        return await new Operation(this.networkID, this.api, this.delegateIP).send(op);
    }

    /**
     * Get account information for the given address.
     * @async
     * @param {string | Address} [address] - The account address to retrieve.
     * @returns `data` of `SuccessResponse` is *null* or account information:
     * - `_hint`: Hint for the account
     * - `hash`: Hash for the account state,
     * - `address`: Address of the account,
     * - `keys`: Object for keys,
     * - `balance`: Array with balance information,
     * - `height`: Latest block height associated with the account,
     * - `contract_account_status`: Object to indicate contract account status and related details
     * 
     * **null means that the account has not yet been recorded in the block.**
     */
    async getAccountInfo(address: string | Address) {
        Address.from(address);
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        const response = await getAPIData(() => accountApi.getAccount(this.api, address, this.delegateIP));
        if (isSuccessResponse(response)) {
            response.data = response.data? response.data : null;
        }
        return response
    }

    /**
     * Get all operations corresponding the given account.
     * @async
     * @param {string | Address} [address] - The account address to retrieve.
     * @param {number} [limit] - (Optional) The maximum number of items to retrieve.
     * @param {number} [offset] - (Optional) The number of items skip before starting to return data.
     * @param {boolean} [reverse] - (Optional) Whether to return the items in reverse newest order.
     * @returns The `data` of `SuccessResponse` is *null* or an array of all operations corresponding the given account:
     * - `_hint`: Indicates mitum engine version,
     * - `_embedded`:
     * - - `_hint`: Hint for the operation,
     * - - `hash`: Hash for the fact,
     * - - `operation`: Information of the operation includes `hash`, `fact`, `signs`, `_hint`,
     * - - `height`: Block height containing the operation,
     * - - `confirmed_at`: Timestamp when the block was confirmed,
     * - - `reason`: Reason for operation failure,
     * - - `in_state`: Boolean indicating whether the operation was successful or not,
     * - - `index`: Index of the operation in the block
     * - `_links`: Links to get additional information

     * **null means that the account has not yet been recorded in the block.**
     */
    async getOperations(
        address: string | Address, 
        limit?: number, offset?: [number, number], reverse?: true
    ) {
        Address.from(address);
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        const response = await getAPIData(() => operationApi.getAccountOperations(this.api, address, this.delegateIP, limit, offset, reverse));
        if (isSuccessResponse(response)) {
            response.data = response.data? response.data : null;
        }
        return response
    }

    /**
     * Get the account information for the given public key. Only accounts created through `create-account` operations can be retreived.
     * @async
     * @param {string | Key | PubKey} [publickey] - The public key to retrieve.
     * @returns `data` of `SuccessResponse` is a array with account informations:
     * - `_hint`: Indicates mitum engine version,
     * - `_embedded`:
     * - - `_hint`: Hint for the account
     * - - `hash`: Hash for the account state,
     * - - `address`: Address of the account,
     * - - `keys`: Object for keys,
     * - - `height`: Latest block height associated with the account,
     * - - `contract_account_status`: Object to indicate contract account status and related details
     * - `_links`: Links to get additional information
     */
    async getByPublickey(publickey: string | Key | PubKey) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        const s = typeof (publickey) === 'string' ? publickey : publickey.toString();
        StringAssert.with(s, MitumError.detail(ECODE.INVALID_PUBLIC_KEY, "invalid public key"))
            .empty().not()
            .chainAnd(
                s.endsWith(SUFFIX.KEY.MITUM.PUBLIC) && Config.KEY.MITUM.PUBLIC.satisfy(s.length),
                /^[0-9a-f]+$/.test(s.substring(0, s.length - Config.SUFFIX.DEFAULT.value!)),
            )
            .excute()
        return await getAPIData(() => accountApi.getAccountByPublicKey(this.api, publickey, this.delegateIP))
    }

    /**
     * Get the currency balance of account for the given address.
     * @async
     * @param {string | Address} [address] - The account address to retrieve.
     * @returns `data` of `SuccessResponse` is *null* or a array with account informations:
     *  - `amount`: String of balance amount,
     *  - `currency`: Currency ID,
     *  - `_hint`: Hint for amount,

     * **null means that the account has not yet been recorded in the block.**
     */
    async balance(address: string | Address) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        Address.from(address);
        const response = await getAPIData(() => accountApi.getAccount(this.api, address, this.delegateIP));
        if (isSuccessResponse(response) && response.data) {
            response.data = response.data.balance ? response.data.balance : null;
        }
        return response
    }
}

export class Contract extends KeyG {
    constructor(
        networkID: string,
        api?: string | IP,
        delegateIP?: string | IP,
    ) {
        super(networkID, api, delegateIP)
    }

    /**
     * Generate a key pair and the corresponding `create-contract-account` operation.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | number | Big} [amount] - The initial amount. (to be paid by the sender)
     * @param {string} [seed] - (Optional) The seed for deterministic key generation. If not provided, a random key pair will be generated.
     * @returns An object containing the wallet(key pair) and the `create-contract-account` operation.
     */
    createWallet(
        sender: string | Address,
        currency: string | CurrencyID,
        amount: string | number | Big,
        seed?: string,
    ): { wallet: AccountType, operation: BaseOperation<CreateContractAccountFact> } {
        const kp = seed ? KeyPair.fromSeed(seed, "mitum") : KeyPair.random("mitum")
        const ks = new Keys([new PubKey(kp.publicKey, 100)], 100)

        return {
            wallet: {
                privatekey: kp.privateKey.toString(),
                publickey: kp.publicKey.toString(),
                address: ks.checksum.toString()
            },
            operation: new BaseOperation(
                this.networkID,
                new CreateContractAccountFact(
                    TimeStamp.new().UTC(),
                    sender,
                    [
                        new CreateContractAccountItem(
                            ks,
                            [new Amount(currency, amount)],
                        )
                    ],
                ),
            ),
        }
    }

    /**
     * Generate `n` number of key pairs and the corresponding `create-contract-account` operation with multiple items.
     * @param {string | Address} [sender] - The sender's address.
     * @param {number} [n] - The number of account to create.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | number | Big} [amount] - The initial amount. (to be paid by the sender)
     * @returns An object containing the wallet (key pairs) and the `create-contract-account` operation with multiple items.
     */
    createBatchWallet(
        sender: string | Address,
        n: number,
        currency: string | CurrencyID,
        amount: string | number | Big,
    ): { wallet: AccountType[], operation: BaseOperation<CreateContractAccountFact> } {
        const keyArray = this.keys(n);
        const items = keyArray.map((ks) => new CreateContractAccountItem(new Keys([new PubKey(ks.publickey,100)], 100),[new Amount(currency, amount)]));
        return {
            wallet: keyArray,
            operation: new BaseOperation(
                this.networkID,
                new CreateContractAccountFact(
                    TimeStamp.new().UTC(),
                    sender,
                    items
                ),
            ),
        }
    }

    /**
     * Generate a `create-contract-account` operation for the given public key.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | Key | PubKey} [key] - The public key or key object.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | number | Big} [amount] - The initial amount. (to be paid by the sender)
     * @returns `create-contract-account` operation.
     */
    createAccount(
        sender: string | Address,
        key: string | Key | PubKey,
        currency: string | CurrencyID,
        amount: string | number | Big,
    ) {
        return new BaseOperation(
            this.networkID,
            new CreateContractAccountFact(
                TimeStamp.new().UTC(),
                sender,
                [
                    new CreateContractAccountItem(
                        new Keys([new PubKey(key, 100)], 100),
                        [new Amount(currency, amount)],
                    )
                ],
            )
        )
    }

    /**
     * Get contract account information for the given address.
     * @async
     * @param {string | Address} [address] - The contract account address to retrieve.
     * @returns `data` of `SuccessResponse` is *null* or account information:
     * - `_hint`: Hint for the account
     * - `hash`: Hash for the account state,
     * - `address`: Address of the account,
     * - `keys`: Object for keys,
     * - `balance`: Array with balance information,
     * - `height`: Latest block height associated with the account,
     * - `contract_account_status`: Object to indicate contract account status and related details

     * **null means that the contract account has not yet been recorded in the block.**
     */
    async getContractInfo(address: string | Address) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        Address.from(address);
        const response = await getAPIData(() => accountApi.getAccount(this.api, address, this.delegateIP));
        if (isSuccessResponse(response)) {
            response.data = response.data? response.data : null;
        }
        return response
    }

    /**
     * Generate an `update-handler` operation to update handlers of contract to given accounts.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | Address} [contract] - The contract account address.
     * @param {string | CurrencyID} [currency] - The currency ID. 
     * @param {(string | Address)[]} [handlers] - The array of addresses to be updated as handlers.
     * @returns `update-handler` operation.
     */
    updateHandler(
        sender: string | Address,
        contract: string | Address,
        currency: string | CurrencyID,
        handlers: (string | Address)[],
    ) {
        return new BaseOperation(
            this.networkID,
            new UpdateHandlerFact(
                TimeStamp.new().UTC(),
                sender,
                contract,
                currency,
                handlers,
            )
        );
    }

    /**
     * Sign and send the `create-contract-account` operation to blockchain network.
     * @async
     * @param {string | Key} [privatekey] - The private key used for signing.
     * @param {Object} [wallet] - The object with properties `wallet` and `operation`. (return value of `createWallet`)
     * @returns A Promise resolving to a `OperationResponse`. `.wait()` can be used like `operation.send`.
     * 
     * Properties of `OperationResponse`:
     * - response: <SuccessResponse | ErrorResponse>
     * - _api: API URL
     * - _delegateIP: IP address for delegation
     * @example
     * // Send operation and check response and receipt:
     * const wallet = mitum.contract.createWallet(...);

     * const touchOperation = async () => {
     *   const data = await mitum.contract.touch(privatekey, wallet);
     *   console.log(data.response);
     *   const receipt = await data.wait();
     *   console.log(receipt);
     * };
     * touchOperation();
     */
    async touch(
        privatekey: string | Key,
        wallet: { wallet: AccountType | AccountType[], operation: BaseOperation<CreateContractAccountFact> }
    ) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        const op = wallet.operation
        op.sign(privatekey)

        return await new Operation(this.networkID, this.api, this.delegateIP).send(op);
    }
}