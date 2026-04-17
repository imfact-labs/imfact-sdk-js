import { RegisterModelFact } from "./resgister-model"
import { CreateDataItem, CreateDataFact } from "./create-data"
import { UpdateDataItem, UpdateDataFact } from "./update-data"
import { DeleteDataFact } from "./delete-data"
import { ContractGenerator, BaseOperation } from "../base"
import { Address } from "../../key/address"
import type { CurrencyID } from "../../common"
import { contractApi } from "../../api"
import { getAPIData } from "../../api/getAPIData"
import type { IP, LongString } from "../../types"
import { TimeStamp as TS, URIString } from "../../types"
import { Assert, MitumError, ECODE, ArrayAssert } from "../../error"
import { Config } from "../../node"
import { convertToArray } from "../../utils"

export class Storage extends ContractGenerator {
    constructor(
        networkID: string,
        api?: string | IP,
        delegateIP?: string | IP,
    ) {
        super(networkID, api, delegateIP)
    }

    /**
     * Generate a `register-model` operation to register new storage model on the contract.
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | LongString} [project] - The project's name
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @returns `register-model` operation.
     */
    registerModel(
        contract: string | Address,
        sender: string | Address,
        project: string | LongString,
        currency: string | CurrencyID,
    ) {
        return new BaseOperation(
            this.networkID,
            new RegisterModelFact(
                TS.new().UTC(),
                sender,
                contract,
                project,
                currency,
            )
        )
    }
    
    /**
     * Generate `create-data` operation to create data with new data key on the storage model.
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string} [dataKey] - The key of data to create.
     * @param {string | LongString} [dataValue] - Value of the data to record.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @returns `create-data` operation
     */
    createData(
        contract: string | Address,
        sender: string | Address,
        dataKey: string,
        dataValue: string | LongString,
        currency: string | CurrencyID,
    ) {
        const item = new CreateDataItem(
            contract,
            dataKey,
            dataValue
        );

        const fact = new CreateDataFact(
            TS.new().UTC(),
            sender,
            [item],
            currency,
        )

        return new BaseOperation(this.networkID, fact)
    }

    /**
     * Generate `create-data` operation to create multiple data on the storage model.
     * @param {string | Address | string[] | Address[]} [contract] - A single contract address (converted to an array) or an array of multiple contract addresses.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string[]} [dataKeys] - The array with key of multiple data to create.
     * @param {string[] | LongString[]} [dataValues] - The array with value of the multiple data to record.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @returns `create-data` operation
     */
    createMultiData(
        contract: string | Address | string[] | Address[],
        sender: string | Address,
        dataKeys: string[],
        dataValues: string[] | LongString[],
        currency: string | CurrencyID,
    ) {
        ArrayAssert.check(dataKeys, "dataKeys")
            .rangeLength(Config.ITEMS_IN_FACT)
            .sameLength(dataValues, "dataValues");

        const contractsArray = convertToArray(contract, dataKeys.length);
        const items = dataKeys.map((_, idx) => new CreateDataItem(
            contractsArray[idx],
            dataKeys[idx],
            dataValues[idx]
        ));
        return new BaseOperation(this.networkID, new CreateDataFact(TS.new().UTC(), sender, items, currency))
    }

    /**
     * Generate `update-data` operation to update data with exist data key on the storage model.
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string} [dataKey] - The key of data to update.
     * @param {string | LongString} [dataValue] - Value of the data to be updated.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @returns `update-data` operation
     */
    updateData(
        contract: string | Address,
        sender: string | Address,
        dataKey: string,
        dataValue: string | LongString,
        currency: string | CurrencyID,
    ) {
        const item = new UpdateDataItem(
            contract,
            dataKey,
            dataValue
        );

        const fact = new UpdateDataFact(
            TS.new().UTC(),
            sender,
            [item],
            currency,
        )

        return new BaseOperation(this.networkID, fact)
    }

    /**
     * Generate `update-data` operation to update multiple data on the storage model.
     * @param {string | Address | string[] | Address[]} [contract] - A single contract address (converted to an array) or an array of multiple contract addresses.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string[]} [dataKeys] - The array with key of multiple data to update.
     * @param {string[] | LongString[]} [dataValues] - The array with value of the multiple data to update.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @returns `update-data` operation
     */
    updateMultiData(
        contract: string | Address | string[] | Address[],
        sender: string | Address,
        dataKeys: string[],
        dataValues: string[] | LongString[],
        currency: string | CurrencyID,
    ) {
        ArrayAssert.check(dataKeys, "dataKeys")
            .rangeLength(Config.ITEMS_IN_FACT)
            .sameLength(dataValues, "dataValues");
            
        const contractsArray = convertToArray(contract, dataKeys.length);
        const items = dataKeys.map((_, idx) => new UpdateDataItem(
            contractsArray[idx],
            dataKeys[idx],
            dataValues[idx]
        ));
        return new BaseOperation(this.networkID, new UpdateDataFact(TS.new().UTC(), sender, items, currency))
    }
    
    /**
     * Generate `delete-data` operation to delete data on the storage model.
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string} [dataKey] - The key of data to delete.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @returns `delete-data` operation
     */
    deleteData(
        contract: string | Address,
        sender: string | Address,
        dataKey: string,
        currency: string | CurrencyID,
    ) {
        new URIString(dataKey, 'dataKey');
        const fact = new DeleteDataFact(
            TS.new().UTC(),
            sender,
            contract,
            dataKey,
            currency,
        )

        return new BaseOperation(this.networkID, fact)
    }
    
    /**
     * Get information about a storage model on the contract.
     * @async
     * @param {string | Address} [contract] - The contract's address.
     * @returns `data` of `SuccessResponse` is information about the storage service:
     * - `_hint`: Hint for storage design,
     * - `project`: Project's name
     */
    async getModelInfo(contract: string | Address) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        Address.from(contract);
        return await getAPIData(() => contractApi.storage.getModel(this.api, contract, this.delegateIP))
    }
    
    /**
     * Get detailed information about a specific data on the project.
     * @async
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | LongString} [dataKey] - The key of the data to search.
     * @returns `data` of `SuccessResponse` is information about the data with certain dataKey on the project:
     * - `data`: Object containing below information
     * - - `dataKey`: The key associated with the data,
     * - - `dataValue`: The current value of the data,
     * - - `deleted`: Indicates whether the data has been deleted
     * - `height`: The block number where the latest related operation is recorded,
     * - `operation`: The fact hash of the latest related operation,
     * - `timestamp`: The timestamp of the latest related operation (prposed_at of block manifest)
     */
    async getData(
        contract: string | Address,
        dataKey: string,
    ) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        Address.from(contract);
        new URIString(dataKey, 'dataKey');
        return await getAPIData(() => contractApi.storage.getData(this.api, contract, dataKey, this.delegateIP))
    }

    /**
     * Get all history information about a specific data on the project.
     * @async
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | LongString} [dataKey] - The key of the data to search.
     * @param {number} [limit] - (Optional) The maximum number of history to retrieve.
     * @param {number} [offset] - (Optional) The Offset setting value based on block height
     * @param {boolean} [reverse] - (Optional) Whether to return the history in reverse newest order.
     * @returns `data` of `SuccessResponse` is an array of the history information about the data:
     * - `_hint`: Hint for currency,
     * - `_embedded`:
     * - - `data`: Object containing below information
     * - - - `dataKey`: The key associated with the data,
     * - - - `dataValue`: The current value of the data,
     * - - - `deleted`: Indicates whether the data has been deleted
     * - - `height`: The block number where the latest related operation is recorded,
     * - - `operation`: The fact hash of the latest related operation,
     * - - `timestamp`: The timestamp of the latest related operation (prposed_at of block manifest),
     * - `_links`: Links for additional information
     */
    async getDataHistory(
        contract: string | Address,
        dataKey: string,
        limit?: number, offset?: number, reverse?: true
    ) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        Address.from(contract);
        new URIString(dataKey, 'dataKey');
        return await getAPIData(() => contractApi.storage.getDataHistory(
            this.api,
            contract,
            dataKey,
            this.delegateIP,
            limit,
            offset,
            reverse
        ))
    }

    /**
     * Get the number of data (not deleted). If `deleted` is true, the number including deleted data.
     * @async
     * @param {string | Address} [contract] - The contract's address.
     * @param {boolean} [deleted] - (Optional) Whether to include deleted data.
     * @returns `data` of `SuccessResponse` is an array of the history information about the data:
     * - `contract`: The address of contract account,
     * - `data_count`: The number of created data on the contract
     */
    async getDataCount(
        contract: string | Address,
        deleted?: true
    ) {
        Address.from(contract);
        return await getAPIData(() => contractApi.storage.getDataCount(
            this.api,
            contract,
            this.delegateIP,
            deleted
        ))
    }
}