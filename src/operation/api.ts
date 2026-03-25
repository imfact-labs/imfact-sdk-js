import { SignOption, Fact } from "./base"
import type { BaseOperation } from "./base/operation"
import { getAPIData } from "../api/getAPIData"
import { Config } from "../node"
import { operationApi } from "../api"
import type { Key } from "../key/pub"
import { KeyPair } from "../key/keypair"
import { Generator, HintedObject, IP, SuccessResponse, ErrorResponse } from "../types"
import { Assert, ECODE, MitumError, ArrayAssert } from "../error"
import { isOpFact, isHintedObject, isBase58Encoded } from "../utils/typeGuard"
import { isSuccessResponse } from "../utils"

export class Operation extends Generator {
	constructor(
		networkID: string,
		api?: string | IP,
		delegateIP?: string | IP,
	) {
		super(networkID, api, delegateIP)
	}

	/**
	 * Get all operations of the network.
	 * @async
	 * @param {number} [limit] - (Optional) The maximum number of items to retrieve.
	 * @param {number} [offset] - (Optional) The number of items skip before starting to return data.
	 * @param {boolean} [reverse] - (Optional) Whether to return the items in reverse newest order.
	 * @returns The `data` of `SuccessResponse` represents an array of all operations in the network:
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
	async getAllOperations(limit?: number, offset?: [number, number], reverse?: true) {
		Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
		return await getAPIData(() => operationApi.getOperations(this.api, this.delegateIP, limit, offset, reverse))
	}


	/**
	 * Get a operation by fact hash.
	 * @async
	 * @param {string} [hash] - The hash value of the fact included in the operation to retrieve
	 * @returns The `data` of `SuccessResponse` is *null* or infomation of the operation:
	 * - `_hint`: Hint for the operation,
	 * - `hash`: Hash for the fact,
	 * - `operation`: 
	 * - - `hash`: Hash fot the operation,
	 * - - `fact`: Object for fact, 
	 * - - `signs`: Array for sign, 
	 * - - `_hint`: Hint for operation type,
	 * - `height`: Block height containing the operation,
	 * - `confirmed_at`: Timestamp when the block was confirmed,
	 * - `reason`: Reason for operation failure,
	 * - `in_state`: Boolean indicating whether the operation was successful or not,
	 * - `index`: Index of the operation in the block
     * 
	 * ***null* means that the account has not yet been recorded in the block.**
	 */
	async getOperation(hash: string) {
		Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
		const response = await getAPIData(() => operationApi.getOperation(this.api, hash, this.delegateIP));
		if (isSuccessResponse(response)) {
			response.data = response.data ? response.data : null;
		}
		return response
	}

	/**
	 * Get multiple operations by array of fact hashes.
	 * Returns excluding operations that have not yet been recorded.
	 * @async
	 * @param {string[]} [hashes] - Array of fact hashes, fact hash must be base58 encoded string with 43 or 44 length.
	 * @returns The `data` of `SuccessResponse` is array of infomation of the operations:
	 * - `_hint`: Hint for the operation,
	 * - `hash`: Hash for the fact,
	 * - `operation`: 
	 * - - `hash`: Hash fot the operation,
	 * - - `fact`: Object for fact, 
	 * - - `signs`: Array for sign, 
	 * - - `_hint`: Hint for operation type,
	 * - `height`: Block height containing the operation,
	 * - `confirmed_at`: Timestamp when the block was confirmed,
	 * - `reason`: Reason for operation failure,
	 * - `in_state`: Boolean indicating whether the operation was successful or not,
	 * - `index`: Index of the operation in the block
	 */
	async getMultiOperations(hashes: string[]) {
		Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
		ArrayAssert.check(hashes, "hashes")
			.noDuplicates()
			.rangeLength(Config.FACT_HASHES);
		hashes.forEach((hash)=>{
			Assert.check(isBase58Encoded(hash) && (hash.length === 44 || hash.length === 43),
			MitumError.detail(ECODE.INVALID_FACT_HASH, "fact hash must be base58 encoded string with 44 or 43 length."))
		});
		const response = await getAPIData(() => operationApi.getMultiOperations(this.api, hashes, this.delegateIP));
		if (isSuccessResponse(response) && Array.isArray(response.data)) {
			response.data = response.data.map((el)=>{return el._embedded})
		};
		
		return response
	}

	/**
	 * Sign the given operation using the provided private key or key pair.
	 * @param {string | Key | KeyPair} privatekey - The private key or key pair for signing.
	 * @param {OP<Fact>} operation - The operation to sign.
	 * @param {SignOption} [option] - (Optional) Option for node sign.
	 * @returns {Promise<OP<Fact>>} A Promise that resolves to the signed operation.
	 */
	async sign(
		privatekey: string | Key | KeyPair,
		operation: BaseOperation<Fact>,
		option?: SignOption,
	): Promise<BaseOperation<Fact>> {
		const op = operation

		await op.sign(
			privatekey instanceof KeyPair ? privatekey.privateKey : privatekey,
			option
	)

		return op
	}


	/**
	 * Send the given singed operation to blockchain network.
	 * @async
	 * @param { Operation<Fact> | HintedObject} [operation] - The operation to send.
	 * @param {{[i: string]: any} | undefined} [headers] - (Optional) Additional headers for the request.
	 * @returns Properties of `OperationResponse`:
	 * - response: <SuccessResponse | ErrorResponse>
	 * - _api: API URL
	 * - _delegateIP: IP address for delegation
	 * @example
	 * // Send operation and check response and receipt:
	 * const sendOperation = async () => {
	 *   const data = await mitum.operation.send(signedOperation);
	 *   console.log(data.response);
	 *   const receipt = await data.wait();
	 *   console.log(receipt);
	 * };
	 * sendOperation();
	 */
	async send(
		operation: HintedObject | BaseOperation<Fact>,
		headers?: { [i: string]: any }
	): Promise<OperationResponse> {
		Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
		Assert.check(
			isOpFact(operation) || isHintedObject(operation), 
			MitumError.detail(ECODE.INVALID_OPERATION, `input is neither in OP<Fact> nor HintedObject format`)
		)
		operation = isOpFact(operation) ? operation.toHintedObject() : operation;
		Assert.check(
			operation.signs.length !== 0, 
			MitumError.detail(ECODE.EMPTY_SIGN, `signature is required before sending the operation`)
		)
		Assert.check(
			Config.OP_SIZE.satisfy(new TextEncoder().encode(JSON.stringify(operation)).length),
			MitumError.detail(ECODE.OP_SIZE_EXCEEDED, `Operation size exceeds the allowed limit of ${Config.OP_SIZE.max} bytes.`)
		)

		const sendResponse = await getAPIData(() => 
		operationApi.send(
			this.api,
			operation, 
			this.delegateIP, 
			headers
		  )
		);

		return new OperationResponse(sendResponse, this.networkID, this.api, this.delegateIP)
	}
}

export class OperationResponse extends Operation {
	readonly response: any;
	constructor(
		response: SuccessResponse | ErrorResponse,
		networkID: string,
		api?: string | IP,
		delegateIP?: string | IP,
	) {
		super(networkID, api, delegateIP)
		this.response = response;
	}

    /**
	 * Get receipt when a sent operation is recorded in a block by polling the blockchain network for a certain time.
	 * @async
	 * @param {number | undefined} [timeout=10000] - (Optional) Timeout for polling in milliseconds. Default is 10000ms.
	 * @param {number | undefined} [interval=1000] - (Optional) Interval for polling in milliseconds. Default is 1000ms. (interval < timeout)
	 * @returns The `data` property of `SuccessResponse` contains information about the operation:
	 * - `_hint`: Hint for the operation,
	 * - `hash`: Hash for the fact,
	 * - `operation`: 
	 * - - `hash`: Hash fot the operation,
	 * - - `fact`: Object for fact, 
	 * - - `signs`: Array for sign, 
	 * - - `_hint`: Hint for operation type,
	 * - `height`: Block height containing the operation,
	 * - `confirmed_at`: Timestamp when the block was confirmed,
	 * - `reason`: Reason for operation failure,
	 * - `in_state`: Boolean indicating whether the operation was successful or not,
	 * - `index`: Index of the operation in the block
	 * 
	 * **If `in_state` is `false`, the operation failed, and the `reason` property provides the failure reason.**
	 */
	async wait(timeout?: number, interval?: number) : Promise<any> {
		Assert.check(this.response.status === 200, MitumError.detail(ECODE.TRANSACTION_REVERTED, `transaction reverted by the network, check error message`))

        let elapsedTime = 0;
		const maxTimeout = timeout ?? 10000;
		const timeoutInterval = interval ?? 1000;

		const validatePositiveInteger = (val: any, name: string) => {
			if (!Number.isSafeInteger(val) || val <= 0) {
				throw MitumError.detail(ECODE.INVALID_FLOAT, `${name} must be a positive integer`);
			}
		}
		validatePositiveInteger(maxTimeout, "timeout");
		validatePositiveInteger(timeoutInterval, "interval");
	
		if (maxTimeout <= timeoutInterval) {
			if (interval === undefined) {
				throw MitumError.detail(ECODE.INVALID_FLOAT, "default interval is 1000, so timeout must be greater than that.");
			} else if (timeout === undefined) {
				throw MitumError.detail(ECODE.INVALID_FLOAT, "default timeout is 10000, so interval must be less than that.");
			} else {
				throw MitumError.detail(ECODE.INVALID_FLOAT, "timeout must be larger than interval.");
			}
		}

		let stop = false;
        while (!stop && elapsedTime < maxTimeout) {
            try {
				const receipt = await this.getOperation(this.response.data.fact.hash);
                if (isSuccessResponse(receipt) && receipt.data !== undefined && receipt.data !== null) {
					if (receipt.data.in_state) {
						console.log('\x1b[34m%s\x1b[0m', `operation in_state is true. fact hash: ${this.response.data.fact.hash}`)
						return receipt;
					} else {
						console.log('\x1b[31m%s\x1b[0m', `operation in_state is false. fact hash: ${this.response.data.fact.hash}, reason: ${receipt.data.reason}`);
						return receipt;
					}
				} else {
                    console.log('\x1b[33m%s\x1b[0m', `polling for ${elapsedTime} ms, fact hash: ${this.response.data.fact.hash}`);
                }
            } catch (error: any) {
				stop = true;
				throw(error);
            }
            elapsedTime += timeoutInterval;
            await new Promise(resolve => setTimeout(resolve, timeoutInterval));
        }
		Assert.check(stop, MitumError.detail(ECODE.TIME_OUT, `timeout reached (${maxTimeout/1000} seconds).`))
    }
}