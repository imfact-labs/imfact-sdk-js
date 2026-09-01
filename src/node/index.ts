import { Version, NetworkID, DEFAULT_NETWORK_ID, Config, RangeConfig } from "./config"

import { blockApi, nodeApi, operationApi } from "../api"
import { Generator, IP } from "../types"
import { getAPIData } from "../api/getAPIData"
import { Assert, MitumError, ECODE } from "../error"
export {
    Version, NetworkID, DEFAULT_NETWORK_ID,
    Config,
    RangeConfig,
}

export class Node extends Generator {
    constructor(api?: string | IP, delegateIP?: string | IP) {
        super("", api, delegateIP)
    }

    /**
     * Get information about the nodes in the network.
     * @async
     * @returns The `data` of `SuccessResponse` represents an array of information of nodes:
     * - `network_id`: The ID of the network to which the node belongs.
     * - `last_manifest`: Information about the most recently created block.
     * - `network_policy`: Policy information of the network.
     * - `local`: Information about the local node.
     * - `consensus`: Status of consensus on the node.
     * - `_hint`: Indicates that the data represents node information.
     */
    async getNodeInfo() {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        return await getAPIData(() => nodeApi.getNode(this.api, this.delegateIP))
    }
}

export class Block extends Generator {
    constructor(api?: string | IP, delegateIP?: string | IP) {
        super("", api, delegateIP)
    }

    /**
     * Get the account information for the given public key.
     * @async
     * @param {number} [limit] - (Optional) The maximum number of items to retrieve.
     * @param {number} [offset] - (Optional) The number of items skip before starting to return data.
     * @param {boolean} [reverse] - (Optional) Whether to return the items in reverse newest order.
     * @returns The `data` of `SuccessResponse` is a array with block manifest info object:
     * - `_hint`: Indicates mitum engine version,
     * - `_embedded`:
     * - - `Manifest`: manifest info includes `proposed_at`, `states_tree`, `hash`, `previous`, `proposal`, `operations_tree`, `suffrage`, `_hint`, `height`. </div/>
     * - - `operations`: number of operations included in the block,
     * - - `confirmed_at`: timestamp,
     * - - `proposer`: node name of proposer,
     * - - `round`: number of round to manifest,
     * - `_links`: links to get additional information
     */
    async getAllBlocks(limit?: number, offset?: number, reverse?: true) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        return await getAPIData(() => blockApi.getBlocks(this.api, this.delegateIP, limit, offset, reverse))
    }


    /**
     * Get information of a block by hash.
     * @async
     * @param {string} [hash] - The hash value of the block to retrieve.
     * @returns The `data` of `SuccessResponse` represents a block manifest:
     * - `Manifest`:
     * - - `proposed_at`: Timestamp when the block was proposed, 
     * - - `states_tree`: Hash for state tree,
     * - - `hash`: Hash for the block, 
     * - - `previous`: Hash for the previous block, 
     * - - `proposal`: Hash for the proposal, 
     * - - `operations_tree`: Hash for the operation tree, 
     * - - `suffrage`: Hash for the suffrage, 
     * - - `_hint`: Hint for the manifest,
     * - - `height`: Block height
     * - `operations`: The number of operations included in the block,
     * - `confirmed_at`: Timestamp when the block was confirmed,
     * - `proposer`: The node name of proposer,
     * - `round`: The number of round to manifest
     */
    async getBlockByHash(hash: string) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        return await getAPIData(() => blockApi.getBlockByHash(this.api, hash, this.delegateIP))
    }

    /**
     * Get information of a block by height.
     * @async
     * @param {number | string} [height] - The height of the block to retrieve.
     * @returns The `data` of `SuccessResponse` represents a block manifest:
     * - `Manifest`: 
     * - - `proposed_at`: Timestamp when the block was proposed, 
     * - - `states_tree`: Hash for state tree,
     * - - `hash`: Hash for the block, 
     * - - `previous`: Hash for the previous block, 
     * - - `proposal`: Hash for the proposal, 
     * - - `operations_tree`: Hash for the operation tree, 
     * - - `suffrage`: Hash for the suffrage, 
     * - - `_hint`: Hint for the manifest,
     * - - `height`: Block height
     * - `operations`: The number of operations included in the block,
     * - `confirmed_at`: Timestamp when the block was confirmed,
     * - `proposer`: The node name of proposer,
     * - `round`: The number of round to manifest
     */
    async getBlockByHeight(height: number | string) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        return await getAPIData(() => blockApi.getBlockByHeight(this.api, height, this.delegateIP))
    }

    /**
     * Get all operations contained in a block of given height.
     * @async
     * @param {number | string} [height] - The height of the block to retrieve operations from.
     * @param {number} [limit] - (Optional) The maximum number of items to retrieve.
     * @param {number} [offset] - (Optional) The number of items skip before starting to return data.
     * @param {boolean} [reverse] - (Optional) Whether to return the items in reverse newest order.
     * @returns The `data` of `SuccessResponse` represents an array of all operations in the block:
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
     */
    async getOperationsByHeight(height: number | string,limit?: number, offset?: number, reverse?: true) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        return await getAPIData(() => operationApi.getBlockOperationsByHeight(this.api, height, this.delegateIP, limit, offset, reverse))
    }
}