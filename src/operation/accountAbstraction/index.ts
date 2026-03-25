import { Fact, UserOperation, Authentication, ProxyPayer, Settlement, OperationJson } from "../base"
import { isUserOp, isHintedObjectFromUserOp } from "../../utils/typeGuard"
import { Generator, HintedObject, IP } from "../../types"
import { Key, KeyPair, Address } from "../../key"
import { Assert, ECODE, MitumError } from "../../error"
import base58 from "bs58"
import { FactJson } from "../base"

export class AccountAbstraction extends Generator {
    constructor(
        networkID: string,
        api?: string | IP,
        delegateIP?: string | IP,
    ) {
        super(networkID, api, delegateIP)
    }
    
    /**
     * Creates a `UserOperation` for account abstraction.
     * @param {Fact | FactJson} fact - The operation fact or fact property (json) of HintedObject of operation.
     * @param {string | Address} contract - The did contract address.
     * @param {string} authentication_id - The authentication ID for the did contract.
     * @returns {UserOperation<Fact>} The created `UserOperation` instance.
     */
    createUserOperation(
        fact: Fact | FactJson,
        contract: string | Address, 
        authentication_id: string,
    ): UserOperation<Fact>  {
        return new UserOperation(
            this.networkID,
            fact,
            new Authentication(contract, authentication_id, undefined),
            null,
            new Settlement(undefined),
        );
    }

    /**
     * Adds an alternative signature to a user operation by filling the `proof_data`
     * field of the `authentication` object.
     *
     * This method accepts either a `UserOperation` instance or a JSON-formatted
     * hinted object. The operation is normalized internally and returned in
     * hinted-object (JSON) format after the signature is applied.
     *
     * @param {string | Key} privateKey - The private key used to generate the signature.
     * @param {UserOperation<Fact> | HintedObject} userOperation - The user operation to update.
     * @returns {Promise<HintedObject | OperationJson>} A hinted-object representation of the user operation
     * with the `authentication.proof_data` field populated.
     */
    async addAlterSign(
        privateKey: string | Key,
        userOperation: UserOperation<Fact> | HintedObject
    ): Promise<HintedObject | OperationJson> {
        Assert.check(
            isUserOp(userOperation) || isHintedObjectFromUserOp(userOperation), 
            MitumError.detail(ECODE.INVALID_USER_OPERATION, `Input must in UserOperation format`)
        )
        const hintedUserOp: HintedObject = isUserOp(userOperation) ? userOperation.toHintedObject() : userOperation;

        privateKey = Key.from(privateKey);
        const keypair = KeyPair.fromPrivateKey<KeyPair>(privateKey);

        const hashBytes = base58.decode(hintedUserOp.fact.hash);
        const alterSign = await keypair.sign(hashBytes);

        hintedUserOp.extension.authentication.proof_data = base58.encode(alterSign);

        return hintedUserOp;
    }

    /**
     * Updates the settlement details of a userOperation and returns a new hinted object of user operation.
     * @param {UserOperation<Fact> | HintedObject} userOperation - The user operation to update settlement.
     * @param {string | Address} opSender - The operation sender's address (Bundler's address).
     * @returns {HintedObject} A new hinted object representing the updated user operation.
     **/
    setSettlement(
        userOperation: UserOperation<Fact> | HintedObject,
        opSender: string | Address
    ): HintedObject {
        const hintedUserOp = this.getHintedUserOperation(userOperation);

        const { authentication, proxy_payer } = hintedUserOp.extension;

        return this.buildHintedObject(
            hintedUserOp,
            {
                authentication: this.createAuthentication(authentication),
                settlement: new Settlement(opSender).toHintedObject(),
                ...(proxy_payer && { proxy_payer: new ProxyPayer(proxy_payer.proxy_payer).toHintedObject() })
            }
        );
    }

    /**
     * Updates the proxy payer details of a userOperation and returns a new hinted object of user operation.
     * @param {UserOperation<Fact> | HintedObject} userOperation - The user operation to update proxy payer.
     * @param {string | Address} proxyPayer - The proxy payer's address. (address of CA)
     * @returns {HintedObject} A new hinted object representing the updated user operation.
     **/
    setProxyPayer(
        userOperation: UserOperation<Fact> | HintedObject,
        proxyPayer: string | Address
    ): HintedObject {
        const hintedUserOp = this.getHintedUserOperation(userOperation);

        const { authentication, settlement } = hintedUserOp.extension;

        return this.buildHintedObject(
            hintedUserOp,
            {
                authentication: this.createAuthentication(authentication),
                proxy_payer: new ProxyPayer(proxyPayer).toHintedObject(),
                settlement: new Settlement(settlement.op_sender).toHintedObject(),
            }
        );
    }

    /** Private method to validate and convert userOperation to HintedObject */
    private getHintedUserOperation(userOperation: UserOperation<Fact> | HintedObject): HintedObject {
        Assert.check(
            isUserOp(userOperation) || isHintedObjectFromUserOp(userOperation),
            MitumError.detail(ECODE.INVALID_USER_OPERATION, `Input must be in UserOperation format`)
        );

        return isUserOp(userOperation) ? userOperation.toHintedObject() : userOperation;
    }

    /** Private method to create an Authentication object */
    private createAuthentication(authentication: any): HintedObject {
        return new Authentication(
            authentication.contract,
            authentication.authentication_id,
            authentication.proof_data
        ).toHintedObject();
    }

    /** Private method to build a HintedObject with the updated extension */
    private buildHintedObject(
        hintedUserOp: HintedObject,
        extension: { [key: string]: HintedObject }
    ): HintedObject {
        return {
            _hint: hintedUserOp._hint,
            fact: hintedUserOp.fact,
            extension,
            hash: "",
            signs: []
        };
    }
}