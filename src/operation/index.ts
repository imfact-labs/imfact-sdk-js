import { SignOption, Operation as OP, Fact } from "./base"

import { Currency, Account, Contract } from "./currency"
import { AccountAbstraction } from "./accountAbstraction"
import { AuthDID } from "./authdid"
import { Signer } from "./signer"

import { Config } from "../node"
import { operation as api, getAPIData } from "../api"
import { Key, KeyPair, Address } from "../key"
import { Generator, HintedObject, IP, SuccessResponse, ErrorResponse } from "../types"
import { Assert, ECODE, MitumError, ArrayAssert } from "../error"
import { isOpFact, isHintedObject } from "../utils/typeGuard"
import { isSuccessResponse } from "../utils"
import { isBase58Encoded } from "../utils/typeGuard"
import { HINT } from "../alias"

import * as Base from "./base"

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
		return await getAPIData(() => api.getOperations(this.api, this.delegateIP, limit, offset, reverse))
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
		const response = await getAPIData(() => api.getOperation(this.api, hash, this.delegateIP));
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
			MitumError.detail(ECODE.INVALID_FACT_HASH, "fact hash must be base58 encoded string with 43 or 44 length."))
		});

		const response = await getAPIData(() => api.getMultiOperations(this.api, hashes, this.delegateIP));
		if (isSuccessResponse(response) && Array.isArray(response.data)) {
			response.data = response.data.map((el)=>{return el._embedded})
		};
		
		return response
	}

	/**
	 * Sign the given operation using the provided private key or key pair.
	 * @param {string | Key | KeyPair} [privatekey] - The private key or key pair for signing.
	 * @param {OP<Fact>} [operation] - The operation to sign.
	 * @param {SignOption} [option] - (Optional) Option for node sign.
	 * @returns The signed operation.
	 */
	sign(
		privatekey: string | Key | KeyPair,
		operation: OP<Fact>,
		option?: SignOption,
	) {
		const op = operation;
		op.sign(privatekey instanceof KeyPair ? privatekey.privateKey : privatekey, option)
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
		operation: HintedObject | OP<Fact>,
		headers?: { [i: string]: any }
	): Promise<OperationResponse> {
		Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
		Assert.check(
			isOpFact(operation) || isHintedObject(operation), 
			MitumError.detail(ECODE.INVALID_OPERATION, `input is neither in OP<Fact> nor HintedObject format`)
		)
		const hintedOperation = isOpFact(operation) ? operation.toHintedObject() : operation
		Assert.check(
			hintedOperation.signs.length !== 0, 
			MitumError.detail(ECODE.EMPTY_SIGN, `signature is required before sending the operation`)
		)
		Assert.check(
			Config.OP_SIZE.satisfy(Buffer.byteLength(JSON.stringify(hintedOperation), 'utf8')),
			MitumError.detail(ECODE.OP_SIZE_EXCEEDED, `Operation size exceeds the allowed limit of ${Config.OP_SIZE.max} bytes.`)
		)

		const sendResponse = await getAPIData(() => 
		api.send(
			this.api,
			hintedOperation, 
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

const credential = {
    registerModel(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.CREDENTIAL.REGISTER_MODEL.OPERATION, contract, true);
    },
	addTemplate(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.CREDENTIAL.ADD_TEMPLATE.OPERATION, contract, true);
    },
	issue(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.CREDENTIAL.ISSUE.OPERATION, contract, true);
    },
	revoke(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.CREDENTIAL.REVOKE.OPERATION, contract, true);
    },
};

const dao = {
    registerModel(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.DAO.REGISTER_MODEL.OPERATION, contract, true);
    },
	updateModelConfig(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.DAO.UPDATE_MODEL_CONFIG.OPERATION, contract, true);
    },
	propose(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.DAO.PROPOSE.OPERATION, contract, true);
    },
	cancelProposal(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.DAO.CANCEL_PROPOSAL.OPERATION, contract, true);
    },
	register(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.DAO.REGISTER.OPERATION, contract, true);
    },
	preSnap(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.DAO.PRE_SNAP.OPERATION, contract, true);
    },
	postSnap(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.DAO.POST_SNAP.OPERATION, contract, true);
    },
	vote(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.DAO.VOTE.OPERATION, contract, true);
    },
	execute(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.DAO.EXECUTE.OPERATION, contract, true);
    },
};

const nft = {
    registerModel(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.NFT.REGISTER_MODEL.OPERATION, contract, true);
    },
	updateModelConfig(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.NFT.UPDATE_MODEL_CONFIG.OPERATION, contract, true);
    },
	mint(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.NFT.MINT.OPERATION, contract, true);
    },
	approveAll(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.NFT.APPROVE_ALL.OPERATION, contract, true);
    },
	approve(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.NFT.APPROVE.OPERATION, contract, true);
    },
	transfer(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.NFT.TRANSFER.OPERATION, contract, true);
    },
	addSignature(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.NFT.ADD_SIGNATURE.OPERATION, contract, true);
    },
}

const payment = {
    registerModel(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.PAYMENT.REGISTER_MODEL.OPERATION, contract, true);
    },
	deposit(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.PAYMENT.DEPOSIT.OPERATION, contract, true);
    },
	updateAccountSetting(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.PAYMENT.UPDATE_ACCOUNT_SETTING.OPERATION, contract, true);
    },
	withdraw(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.PAYMENT.WITHDRAW.OPERATION, contract, true);
    },
	transfer(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.PAYMENT.REGISTER_MODEL.OPERATION, contract, true);
    },
}

const point = {
    registerModel(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.POINT.REGISTER_MODEL.OPERATION, contract, true);
    },
	mint(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.POINT.MINT.OPERATION, contract, true);
    },
	transfer(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.POINT.TRANSFER.OPERATION, contract, true);
    },
	multiTransfer(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.POINT.TRANSFERS.OPERATION, contract, true);
    },
	approve(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.POINT.APPROVE.OPERATION, contract, true);
    },
	multiApprove(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.POINT.APPROVES.OPERATION, contract, true);
    },
	burn(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.POINT.BURN.OPERATION, contract, true);
    },
	transferFrom(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.POINT.TRANSFER_FROM.OPERATION, contract, true);
    },
	multiTransferFrom(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.POINT.TRANSFERS_FROM.OPERATION, contract, true);
    },
}

const storage = {
    registerModel(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.STORAGE.REGISTER_MODEL.OPERATION, contract, true);
    },
    createData(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.STORAGE.CREATE_DATA.OPERATION, contract, true);
    },
    createDatas(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.STORAGE.CREATE_DATAS.OPERATION, contract, true);
    },
    deleteData(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.STORAGE.DELETE_DATA.OPERATION, contract, true);
    },
    updateData(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.STORAGE.UPDATE_DATA.OPERATION, contract, true);
    },
    updateDatas(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.STORAGE.UPDATE_DATAS.OPERATION, contract, true);
    },
}

const timestamp = {
    registerModel(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.TIMESTAMP.REGISTER_MODEL.OPERATION, contract, true);
    },
	issue(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.TIMESTAMP.ISSUE.OPERATION, contract, true);
    },
}

const token = {
    registerModel(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.TOKEN.REGISTER_MODEL.OPERATION, contract, true);
    },
	mint(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.TOKEN.MINT.OPERATION, contract, true);
    },
	transfer(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.TOKEN.TRANSFER.OPERATION, contract, true);
    },
	multiTransfer(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.TOKEN.TRANSFERS.OPERATION, contract, true);
    },
	approve(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.TOKEN.APPROVE.OPERATION, contract, true);
    },
	multiApprove(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.TOKEN.APPROVES.OPERATION, contract, true);
    },
	burn(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.TOKEN.BURN.OPERATION, contract, true);
    },
	transferFrom(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.TOKEN.TRANSFER_FROM.OPERATION, contract, true);
    },
	multiTransferFrom(contract: string | Address): Base.AllowedOperation {
        return new Base.AllowedOperation(HINT.TOKEN.TRANSFERS_FROM.OPERATION, contract, true);
    },
}

export {
	Currency, Account, Contract,
	AuthDID,
	AccountAbstraction,
	Signer,
	Base,
	credential, dao, nft, payment,
	point, storage, timestamp, token
}