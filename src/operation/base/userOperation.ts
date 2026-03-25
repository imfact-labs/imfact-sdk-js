import base58 from "bs58"
import { isBase58Encoded } from "../../utils/typeGuard"
import { Fact } from "./fact"
import { GeneralFactSign, NodeFactSign } from "./factsign"
import { Operation } from "./operation"
import { Hint } from "../../common"
import { HINT } from "../../alias"
import { SortFunc } from "../../utils"
import { validateDID, isFactJson } from "../../utils/typeGuard"
import { Assert, ECODE, MitumError } from "../../error"
import { Address, Key, KeyPair } from "../../key"
import { HintedObject, HintedExtensionObject, IHintedObject, TimeStamp } from "../../types"
import { FactJson, OperationJson } from "./types"
import { concatBytes } from "../../utils/bytes"
import { base64ToBytes, bytesToUtf8 } from "../../utils/base64"

type FactSign = GeneralFactSign | NodeFactSign

const encoder = new TextEncoder();

export class Authentication implements IHintedObject {
    readonly contract: Address;
    readonly authenticationId: string;
    readonly proofData: string;
    private hint: Hint;
    
    constructor(
        contract: string | Address, 
        authenticationId: string, 
        proofData : string | undefined,
    ) {
        this.hint = new Hint(HINT.CURRENCY.EXTENSION.AUTHENTICATION);
        this.contract = Address.from(contract);
        this.authenticationId = authenticationId;
        if (proofData) {
            Assert.check(
                isBase58Encoded(proofData),
                MitumError.detail(ECODE.INVALID_USER_OPERATION, `proof_data must in base58 encoded`)
            );
        };
        this.proofData = proofData ? proofData : "";
    }

    toHintedObject(): HintedObject {
        return {
            _hint: this.hint.toString(),
            contract: this.contract.toString(),
            authentication_id: this.authenticationId,
            proof_data: this.proofData,
        }
    }
}

export class ProxyPayer implements IHintedObject {
    readonly proxyPayer: Address;
    private hint: Hint;
 
    constructor(
        proxyPayer: string | Address,
    ) {
        this.hint = new Hint(HINT.CURRENCY.EXTENSION.PROXY_PAYER);
        this.proxyPayer = Address.from(proxyPayer);
    }

    toHintedObject(): HintedObject {
        return {
            _hint: this.hint.toString(),
            proxy_payer: this.proxyPayer.toString(),
        }
    }
}

export class Settlement implements IHintedObject {
    readonly opSender: Address | "";
    private hint: Hint;
 
    constructor(
        opSender: string | Address | undefined,
    ) {
        this.hint = new Hint(HINT.CURRENCY.EXTENSION.SETTLEMENT);
        this.opSender = opSender ? Address.from(opSender) : "";
    }

    toHintedObject(): HintedObject {
        return {
            _hint: this.hint.toString(),
            op_sender: this.opSender.toString(),
        }
    }
}

class RestoredFact extends Fact {
    readonly _hash: Uint8Array;
    readonly factJson: FactJson;
    readonly sender: Address;

    constructor(factJson: FactJson) {
        const token_seed = bytesToUtf8(base64ToBytes(factJson.token));
        const parts = factJson._hint.split('-');
        super(parts.slice(0, parts.length - 1).join('-'), token_seed);

        this.factJson = factJson;
        this.sender = new Address(factJson.sender);
        this._hash = factJson.hash ? this.hashing() : new Uint8Array();
    }

    get operationHint(): string {
        const parts = this.factJson._hint.split('-');
        return parts.slice(0, parts.length - 2).join('-');
    }

    toHintedObject(): FactJson {
        return this.factJson;
    }

    hashing(): Uint8Array {
        return this.factJson.hash ? base58.decode(this.factJson.hash): new Uint8Array();
    }
}

export class UserOperation<T extends Fact> extends Operation<T> {
    readonly id: string
    readonly hint: Hint
    readonly fact: T
    protected auth: Authentication
    protected proxyPayer: null | ProxyPayer
    protected settlement: Settlement
    protected _factSigns: FactSign[]
    protected _hash: Uint8Array
    constructor(
        networkID: string,
        fact: T | FactJson,
        auth: Authentication,
        proxyPayer: null | ProxyPayer,
        settlement: Settlement
    ) {
        super(networkID, (!isFactJson(fact) ? fact : UserOperation.restoreFactFromJson<T>(fact)) as T);
        this.id = networkID;
        this.fact = (!isFactJson(fact) ? fact : UserOperation.restoreFactFromJson<T>(fact)) as T;

        if ("sender" in fact) {
            this.isSenderDidOwner(fact.sender, auth.authenticationId, true);
        };

        this.auth = auth;
        this.proxyPayer = proxyPayer;
        this.settlement = settlement;

        this.hint = new Hint(this.fact.operationHint);
        this._factSigns = [];
        this._hash = this.hashing();
    }

    static restoreFactFromJson<T extends Fact>(factJson: FactJson): T {
        const fact = new RestoredFact(factJson);
        return fact as unknown as T;
    }

    get hash() {
        return this._hash
    }

    toBytes(): Uint8Array {
        if (!this._factSigns) {
            return this.fact.hash;
        }

        this._factSigns = this._factSigns.sort(SortFunc);

        return concatBytes([
            encoder.encode(JSON.stringify(this.toHintedExtension())),
            this.fact.hash,
            concatBytes(this._factSigns.map((fs) => fs.toBytes())),
        ]);
    }

    toHintedObject(): OperationJson {
        const operation = {
            _hint: this.hint.toString(),
            fact: this.fact.toHintedObject(),
            extension: this.proxyPayer ? 
            {
                authentication: this.auth.toHintedObject(),
                proxy_payer: this.proxyPayer.toHintedObject(),
                settlement: this.settlement.toHintedObject(),
            } :
            {
                authentication: this.auth.toHintedObject(),
                settlement: this.settlement.toHintedObject(),
            },
            hash: this._hash.length === 0 ? "" : base58.encode(this._hash)
        }
        const factSigns = this._factSigns.length === 0 ? [] : this._factSigns.sort(SortFunc);

        return {
            ...operation,
            signs: factSigns.map(fs => fs.toHintedObject())
        }
    }

    private toHintedExtension(): HintedExtensionObject {
        return this.proxyPayer ? 
            {
                authentication: this.auth.toHintedObject(),
                proxy_payer: this.proxyPayer.toHintedObject(),
                settlement: this.settlement.toHintedObject(),
            } :
            {
                authentication: this.auth.toHintedObject(),
                settlement: this.settlement.toHintedObject(),
            }
    }

    private isSenderDidOwner(sender: string | Address, did: string, id?: true) {
        Assert.check(
            sender.toString() === validateDID(did.toString(), id).toString(),
            MitumError.detail(ECODE.AUTH_DID.INVALID_DID, `The owner of did must match the sender(${sender.toString()}). check the did (${did.toString()})`)
        );
    }

    /**
     * Adds an alternative signature to the user operation.
     * This fills the `proof_data` field of the `authentication` object using the provided private key.
     *
     * @param {string | Key} privateKey - The private key used to generate the alternative signature.
     * @returns {Promise<void>} Resolves when the alternative signature has been generated and applied.
     */
    async addAlterSign(privateKey: string | Key): Promise<void> {
        privateKey = Key.from(privateKey);
        const keypair = KeyPair.fromPrivateKey<KeyPair>(privateKey);
        const alterSign = await keypair.sign(this.fact.hash);
        this.auth = new Authentication(this.auth.contract, this.auth.authenticationId, base58.encode(alterSign)); // base58 인코딩 후 저장
    }

    /**
     * Sets settlement information for the userOperation.
     * `op_sender` is the account address that will **sign this UserOperation**.
     * When signatures are added later, the operation **must be signed using the private key of `op_sender`**.
     * If no `proxyPayer` is specified, `op_sender` will also act as the **fee payer** for this UserOperation.
     * @param {string | Address} opSender - The account address that acts as the signer .
     * @returns void.
     **/
    setSettlement(opSender: string | Address): void {
        Address.from(opSender);
        this.settlement = new Settlement(opSender);
    }

    /**
     * Sets a proxy payer for the UserOperation.
     *
     * `proxyPayer` is an address of a **CA (Contract Account)** that pays the transaction fee
     * from its own balance when this userOperation is executed.
     * The proxy payer **must be preconfigured** to allow this operation:
     * the `sender` of the UserOperation's Fact must be registered as a
     * permitted recipient in the proxy payer contract.
     *
     * This setting is optional. If not set, the fee will be paid by `settlement.op_sender`.
     * @param {string | Address} proxyPayer - The CA address that will pay the transaction fee.
     * @returns void.
     **/
    setProxyPayer(proxyPayer: string | Address): void {
        Address.from(proxyPayer);
        this.proxyPayer = new ProxyPayer(proxyPayer);
    }

    /**
     * Signs the user operation using the provided private key.
     *
     * This method validates required fields, generates a signature, and updates the internal
     * factSigns and operation hash. The signing process is asynchronous and must be awaited.
     *
     * @param {string | Key} privatekey - The private key used for signing the operation.
     * @returns {Promise<void>} Resolves when the operation has been successfully signed.
     */
    async sign(privatekey: string | Key): Promise<void> {
        const userOperationFields = {
            contract: this.auth.contract.toString(),
            authentication_id : this.auth.authenticationId,
            proof_data: this.auth.proofData,
            op_sender: this.settlement.opSender.toString(),
        };
        
        Object.entries(userOperationFields).forEach(([key, value]) => {
            if (!value) {
                if (key === "proof_data") {
                    throw MitumError.detail(
                        ECODE.INVALID_USER_OPERATION,
                        "Cannot sign the user operation: proof_data is empty. Did you forget to 'await' addAlterSign()?"
                    );
                }
        
                throw MitumError.detail(
                    ECODE.INVALID_USER_OPERATION,
                    `Cannot sign the user operation: ${key} must not be empty.`
                );
            }
        });

        const keypair = KeyPair.fromPrivateKey(privatekey);
        const now = TimeStamp.new();
       

        const factSign = new GeneralFactSign(
            keypair.publicKey,
            await keypair.sign(concatBytes([encoder.encode(this.id), this.fact.hash, now.toBytes()])),
            now.toString(),
        );

        const idx = this._factSigns
            .map((fs) => fs.signer.toString())
            .indexOf(keypair.publicKey.toString());

        if (idx < 0) {
            this._factSigns.push(factSign);
        } else {
            this._factSigns[idx] = factSign;
        }

        this._hash = this.hashing();
    }

    // export(filePath: string) {
    //     writeFile(filePath, JSON.stringify(this.toHintedObject(), null, 4), (e) => {
    //         if (e) {
    //             throw MitumError.detail(ECODE.FAIL_FILE_CREATION, "fs write-file failed")
    //         }
    //     })
    // }
}