import { RegisterModelFact } from "./register-model"
import { MintFact } from "./mint"
import { BurnFact } from "./burn"
import { TransferFact, TransferItem } from "./transfer"
import { ApproveFact, ApproveItem } from "./approve"
import { TransferFromFact, TransferFromItem } from "./transfer-from"
import { ContractGenerator, BaseOperation } from "../base"
import { Address } from "../../key/address"
import type { CurrencyID } from "../../common"
import { contractApi } from "../../api"
import { getAPIData } from "../../api/getAPIData"
import { Big, IP, LongString, TimeStamp } from "../../types"
import { calculateAllowance } from "../../utils/contractUtils"
import { isSuccessResponse, convertToArray } from "../../utils"
import { Assert, MitumError, ECODE, ArrayAssert } from "../../error"
import { Config } from "../../node"

export class Token extends ContractGenerator {
    constructor(
        networkID: string,
        api?: string | IP,
        delegateIP?: string | IP,
    ) {
        super(networkID, api, delegateIP)
    }

    /**
     * Generate a `register-model` operation to register new token model on a contract.
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | LongString} [name] - The name of the token to register.
     * @param {string | CurrencyID} [symbol] - The symbol of the token to register.
     * @param {string | number | Big} [decimal] - (Optional) The decimal number to the token to register. If not provided, the default value is 0.
     * @param {string | number | Big} [initialSupply] - (Optional) The initial supply of the token to register. If not provided, the default value is 0.
     * @returns `register-model` operation.
     */
    registerModel(
        contract: string | Address,
        sender: string | Address,
        currency: string | CurrencyID,
        name: string | LongString,
        symbol: string | CurrencyID,
        decimal?: string | number | Big,
        initialSupply?: string | number | Big,
    ) {
        return new BaseOperation(
            this.networkID,
            new RegisterModelFact(
                TimeStamp.new().UTC(),
                sender,
                contract,
                currency,
                symbol,
                name,
                decimal ?? 0,
                initialSupply ?? 0,
            )
        )
    }

    /**
     * Generate a `mint` operation for minting tokens and allocating them to a receiver.
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | Address} [receiver] - The receiver's address. 
     * @param {string | number | Big} [amount] - The amount to mint.
     * @returns `mint` operation.
     */
    mint(
        contract: string | Address,
        sender: string | Address,
        currency: string | CurrencyID,
        receiver: string | Address,
        amount: string | number | Big,
    ) {
        return new BaseOperation(
            this.networkID,
            new MintFact(
                TimeStamp.new().UTC(),
                sender,
                contract,
                currency,
                receiver,
                amount,
            )
        )
    }

    /**
     * Generate a `burn` operation for burning tokens from sender account.
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | number | Big} [amount] - The amount to burn.
     * @returns `burn` operation
     */
    burn(
        contract: string | Address,
        sender: string | Address,
        currency: string | CurrencyID,
        amount: string | number | Big,
    ) {
        return new BaseOperation(
            this.networkID,
            new BurnFact(
                TimeStamp.new().UTC(),
                sender,
                contract,
                currency,
                amount,
            )
        )
    }

    /**
     * Generate an `transfer` operation for transferring tokens from the sender to a receiver.
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | Address} [receiver] - The receiver's address.
     * @param {string | number | Big} [amount] - The amount to transfer.
     * @returns `transfer` operation.
     */
    transfer(
        contract: string | Address,
        sender: string | Address,
        currency: string | CurrencyID,
        receiver: string | Address,
        amount: string | number | Big,
    ) {
        const item = new TransferItem(
            contract,
            receiver,
            amount,
        );

        return new BaseOperation(
            this.networkID,
            new TransferFact(
                TimeStamp.new().UTC(),
                sender,
                [item],
                currency,
            )
        )
    }

    /**
     * Generate an `transfer` operation with multi items to transfer tokens from the sender to a receiver.
     * @param {string | Address | string[] | Address[]} [contract] - A single contract address (converted to an array) or an array of multiple contract addresses.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string[] | Address[]} [receiver] - The array of receiver's address.
     * @param {string[] | number[] | Big[]} [amount] - The array of amounts to transfer.
     * @returns `transfer` operation with multi items.
     */
    multiTransfer(
        contract: string | Address | string[] | Address[],
        sender: string | Address,
        currency: string | CurrencyID,
        receiver: string[] | Address[],
        amount: string[] | number[] | Big[],
    ) {
        ArrayAssert.check(receiver, "receiver").rangeLength(Config.ITEMS_IN_FACT).sameLength(amount, "amount");

        const contractsArray = convertToArray(contract, receiver.length);
        const items = Array.from({ length: receiver.length }).map((_, idx) => new TransferItem(
            contractsArray[idx],
            receiver[idx],
            amount[idx],
        ));

        return new BaseOperation(
            this.networkID,
            new TransferFact(
                TimeStamp.new().UTC(),
                sender,
                items,
                currency,
            )
        )
    }

    /**
     * Generate a `transfer-from` operation for transferring tokens from target account to receiver.
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | Address} [receiver] - The receiver's address.
     * @param {string | Address} [target] - The target account's address.
     * @param {string | number | Big} [amount] - The amount to transfer.
     * @returns `transfer-from` operation.
     */
    transferFrom(
        contract: string | Address,
        sender: string | Address,
        currency: string | CurrencyID,
        receiver: string | Address,
        target: string | Address,
        amount: string | number | Big,
    ) {
        const item = new TransferFromItem(
            contract,
            receiver,
            target,
            amount,
        );

        return new BaseOperation(
            this.networkID,
            new TransferFromFact(
                TimeStamp.new().UTC(),
                sender,
                [item],
                currency,
            )
        )
    }

    /**
     * Generate a `transfer-from` operation with multi item to transfer tokens from targets account to receivers.
     * @param {string | Address | string[] | Address[]} [contract] - A single contract address (converted to an array) or an array of multiple contract addresses.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string[] | Address[]} [receiver] - The array of receiver's addresses.
     * @param {string[] | Address[]} [target] - The array of target account's addresses.
     * @param {string[] | number[] | Big[]} [amount] - The array of amounts to transfer.
     * @returns `transfer-from` operation.
     */
    multiTransferFrom(
        contract: string | Address | string[] | Address[],
        sender: string | Address,
        currency: string | CurrencyID,
        receiver: string[] | Address[],
        target: string[] | Address[],
        amount: string[] | number[] | Big[],
    ) {
        ArrayAssert.check(receiver, "receiver")
            .rangeLength(Config.ITEMS_IN_FACT)
            .sameLength(amount, "amount")
            .sameLength(target, "target");
        
        const contractsArray = convertToArray(contract, receiver.length);
        const items = Array.from({ length: receiver.length }).map((_, idx) => new TransferFromItem(
            contractsArray[idx],
            receiver[idx],
            target[idx],
            amount[idx],
        ));

        return new BaseOperation(
            this.networkID,
            new TransferFromFact(
                TimeStamp.new().UTC(),
                sender,
                items,
                currency,
            )
        )
    }

    /**
     * Generate an `approve` operation for approving certain amount tokens to approved account.
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string | Address} [approved] - The address to approve.
     * @param {string | number | Big} [amount] - The amount to approve.
     * @returns `approve` operation
     */
    approve(
        contract: string | Address,
        sender: string | Address,
        currency: string | CurrencyID,
        approved: string | Address,
        amount: string | number | Big,
    ) {
        const item = new ApproveItem(
            contract,
            approved,
            amount,
        );

        return new BaseOperation(
            this.networkID,
            new ApproveFact(
                TimeStamp.new().UTC(),
                sender,
                [item],
                currency,
            )
        )
    }

    /**
     * Generate an `approve` operation with multi items to approve certain amount tokens to approved account.
     * @param {string | Address | string[] | Address[]} [contract] - A single contract address (converted to an array) or an array of multiple contract addresses.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @param {string[] | Address[]} [approved] - The array of addresses to approve.
     * @param {string[] | number[] | Big[]} [amount] - The array amounts to approve.
     * @returns `approve` operation with multi item
     */
    multiApprove(
        contract: string | Address | string[] | Address[],
        sender: string | Address,
        currency: string | CurrencyID,
        approved: string[] | Address[],
        amount: string[] | number[] | Big[],
    ) {
        ArrayAssert.check(approved, "approved").rangeLength(Config.ITEMS_IN_FACT).sameLength(amount, "amount");

        const contractsArray = convertToArray(contract, approved.length);
        const items = Array.from({ length: approved.length }).map((_, idx) => new ApproveItem(
            contractsArray[idx],
            approved[idx],
            amount[idx],
        ));

        return new BaseOperation(
            this.networkID,
            new ApproveFact(
                TimeStamp.new().UTC(),
                sender,
                items,
                currency,
            )
        )
    }

    /**
     * Get information about the specific token model on the contract.
     * @async
     * @param {string | Address} [contract] - The contract's address.
     * @returns `data` of `SuccessResponse` is token information:
     * - `_hint`: Hint for token design,
     * - `symbol`: Symbol of the token,
     * - `name`: Name of the token,
     * - `policy`: Token policy object including `_hint`, `total_supply`, `approve_list`
     */
    async getModelInfo(contract: string | Address) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        Address.from(contract);
        return await getAPIData(() => contractApi.token.getModel(this.api, contract, this.delegateIP))
    }

    /**
     * Get the allowance information granted by the owner for a specific token.
     * @async
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [owner] - The token owner's address.
     * @param {string | Address} [approved] - Address of approved account.
     * @returns `data` of `SuccessResponse` is token allowance information:
     * - `amount`: String of allowance amount
     */
    async getAllowance(contract: string | Address, owner: string | Address, approved: string | Address) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        Address.from(contract);
        Address.from(owner);
        Address.from(approved);
        const response = await getAPIData(() => contractApi.token.getModel(this.api, contract, this.delegateIP));
        if (isSuccessResponse(response) && response.data) {
            response.data = calculateAllowance(response, owner, approved);
        }
        return response
    }

    /**
     * Get token balance for given account.
     * @async
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [account] - The token owner's address.
     * @returns`data` of `SuccessResponse` is token balance information:
     * - `amount`: String of amount
     */
    async getBalance(contract: string | Address, account: string | Address) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        Address.from(contract);
        Address.from(account);
        return await getAPIData(() => contractApi.token.getTokenBalance(this.api, contract, account, this.delegateIP))
    }
}