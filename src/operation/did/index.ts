import { RegisterModelFact } from "./register-model"
import { CreateFact } from "./create-did"
import { UpdateDocumentFact } from "./update-did-document"
import { AsymKeyAuth, LinkedAuth, Document, Service } from "./document"
import { ContractGenerator, Operation, AllowedOperation } from "../base"
import { Address, Key } from "../../key"
import { CurrencyID } from "../../common"
import { contractApi, getAPIData } from "../../api"
import { isSuccessResponse  } from "../../utils"
import { validateDID } from "../../utils/typeGuard"
import { IP, TimeStamp as TS, LongString } from "../../types"
import { Assert, MitumError, ECODE } from "../../error"
import { HINT } from "../../alias"

type verificationKeyType =
    | "Ed25519VerificationKey2020"
    | "EcdsaSecp256k1VerificationKey2019"
    | "EcdsaSecp256k1VerificationKeyImFact2025";

type asymKeyAuthOpt =
    | "SECP256K1_2019"
    | "SECP256K1_IMFACT_2025";

const ASYMKEY_TYPE_MAP: Record<asymKeyAuthOpt, verificationKeyType> = {
    SECP256K1_2019: "EcdsaSecp256k1VerificationKey2019",
    SECP256K1_IMFACT_2025: "EcdsaSecp256k1VerificationKeyImFact2025",
};

type asymkeyAuth = {
    _hint: string,
    id: string | LongString,
    type: verificationKeyType,
    controller: string | LongString,
    publicKeyImFact: string | Key,
}

type linkedAuth = {
    _hint: string,
    id: string | LongString,
    type: "LinkedVerificationMethod",
    controller: string | LongString,
    targetId: string | LongString,
    allowed: AllowedOperation[]
}

type document = {
    _hint: string,
    "@context": string[] | LongString[],
    id: string | LongString, 
    authentication: (asymkeyAuth | linkedAuth)[],
    verificationMethod: [],
    service?: {
        id: string | LongString,
        type: string | LongString,
        service_end_point: string | LongString
    }[]
}

const isOfType = <T>(obj: unknown, keys: (keyof T)[]): obj is T =>
    typeof obj === "object" && obj !== null && keys.every((key) => key in obj);

const validateAuthentication = (auth: unknown, index: number): void => {
    const baseKeys = ["_hint", "id", "type", "controller"] as (keyof (asymkeyAuth | linkedAuth))[];
    
    if (!isOfType<asymkeyAuth | linkedAuth>(auth, baseKeys)) {
        throw MitumError.detail(ECODE.DID.INVALID_AUTHENTICATION, "Invalid authentication type");
    }
    if ((auth as asymkeyAuth).type === "Ed25519VerificationKey2020" || (auth as asymkeyAuth).type === "EcdsaSecp256k1VerificationKeyImFact2025" ||  (auth as asymkeyAuth).type === "EcdsaSecp256k1VerificationKey2019") {
        const asymkeyAuthKeys = [...baseKeys, "publicKeyImFact"] as (keyof asymkeyAuth)[];
        if (!isOfType<asymkeyAuth>(auth, asymkeyAuthKeys)) {
            throw MitumError.detail(ECODE.DID.INVALID_AUTHENTICATION, `Asymkey authentication at index ${index} is missing required fields.`);
        }
    }

    else if ((auth as linkedAuth).type === "LinkedVerificationMethod") {
        const linkedAuthKeys = [...baseKeys, "targetId", "allowed"] as (keyof linkedAuth)[];
    
        if (!isOfType<linkedAuth>(auth, linkedAuthKeys)) {
            throw MitumError.detail(
                ECODE.DID.INVALID_AUTHENTICATION,
                `Linked authentication at index ${index} is missing required fields.`
            );
        }
    
        if (!Array.isArray(auth.allowed)) {
            throw MitumError.detail(
                ECODE.DID.INVALID_AUTHENTICATION,
                `The 'allowed' field in linked authentication at index ${index} must be an array.`
            );
        }
    
        if (
            typeof auth.targetId !== "string" &&
            !(auth.targetId instanceof LongString)
        ) {
            throw MitumError.detail(
                ECODE.DID.INVALID_AUTHENTICATION,
                `Invalid 'targetId' in linked authentication at index ${index}.`
            );
        }
    }
    else {
        throw MitumError.detail(ECODE.DID.INVALID_AUTHENTICATION, `Unknown authentication type at index ${index}.`);
    }
};

export class Did extends ContractGenerator {
    constructor(
        networkID: string,
        api?: string | IP,
        delegateIP?: string | IP,
    ) {
        super(networkID, api, delegateIP)
    }

    private normalizeDocument(
        doc: document | Document,
        sender: string | Address
    ): Document {
        if (doc instanceof Document) {
            return doc;
        }

        this.validateDocument(doc);
        this.isSenderDidOwner(sender, doc.id);
        if (doc.service) {
            doc.service.forEach(service => {
                this.isSenderDidOwner(sender, service.id, true);
            });
        }

        return new Document(
            doc["@context"],
            doc.id,
            doc.authentication.map(el =>
                this.mapAuthToClass(el, sender)
            ),
            doc.verificationMethod.map(el =>
                this.mapAuthToClass(el, sender)
            ),
            doc.service
                ? doc.service.map(
                      service =>
                          new Service(
                              service.id,
                              service.type,
                              service.service_end_point
                          )
                  )
                : undefined
        );
    }
    
    private validateDocument(doc: unknown): void {
        if (!doc || typeof doc !== "object") {
            throw MitumError.detail(ECODE.DID.INVALID_DOCUMENT, `document must be an object, got ${doc === null ? "null" : typeof doc}`);
        }
    
        const d = doc as any;
    
        if (typeof d._hint !== "string") {
            throw MitumError.detail(ECODE.DID.INVALID_DOCUMENT, "_hint must be a string");
        }
    
        if (!Array.isArray(d["@context"])) {
            throw MitumError.detail(ECODE.DID.INVALID_DOCUMENT, "@context must be an array"
            );
        }
    
        if (!d.id) {
            throw MitumError.detail(ECODE.DID.INVALID_DOCUMENT, "id is required");
        }
    
        if (!Array.isArray(d.authentication)) {
            throw MitumError.detail(ECODE.DID.INVALID_DOCUMENT, "authentication must be an array");
        }
    
        if (!Array.isArray(d.verificationMethod)) {
            throw MitumError.detail(ECODE.DID.INVALID_DOCUMENT, "verificationMethod must be an array");
        }
    
        for (const [i, ctx] of d["@context"].entries()) {
            if (typeof ctx !== "string" && !(ctx instanceof LongString)) {
                throw MitumError.detail(
                    ECODE.DID.INVALID_DOCUMENT,
                    `@context[${i}] must be string or LongString`
                );
            }
        }
    
        d.authentication.forEach((auth: unknown, i: number) => {
            try {
                validateAuthentication(auth, i);
            } catch (e) {
                throw MitumError.detail(ECODE.DID.INVALID_DOCUMENT, `invalid authentication[${i}]: ${(e as Error).message}`);
            }
        });
    
        d.verificationMethod.forEach((vm: unknown, i: number) => {
            try {
                validateAuthentication(vm, i);
            } catch (e) {
                throw MitumError.detail(ECODE.DID.INVALID_DOCUMENT,`invalid verificationMethod[${i}]: ${(e as Error).message}`);
            }
        });
    
        if (d.service !== undefined && d.service !== null) {
            if (!Array.isArray(d.service)) {
                throw MitumError.detail(ECODE.DID.INVALID_DOCUMENT, "service must be an array if provided");
            }
    
            d.service.forEach((el: any, i: number) => {
                if (!el || typeof el !== "object") {
                    throw MitumError.detail(ECODE.DID.INVALID_DOCUMENT, `service[${i}] must be an object`
                    );
                }
    
                if (!el.id || !el.type || !el.service_end_point) {
                    throw MitumError.detail(ECODE.DID.INVALID_DOCUMENT, `service[${i}] requires id, type, service_end_point`);
                }
            });
        }
    }
    

    private isSenderDidOwner(sender: string | Address, did: string | LongString, id?: true) {
        Assert.check(
            sender.toString() === validateDID(did.toString(), id).toString(),
            MitumError.detail(ECODE.DID.INVALID_DID, `The owner of did must match the sender(${sender.toString()}). check the did (${did.toString()})`)
        );
    }

    private mapAuth(auth: asymkeyAuth | linkedAuth): AsymKeyAuth | LinkedAuth 
    {
        if (auth.type === "LinkedVerificationMethod") {
            return new LinkedAuth(
                auth.id,
                auth.controller,
                auth.targetId,
                auth.allowed
            );
        }

        if (
            auth.type === "Ed25519VerificationKey2020" ||
            auth.type === "EcdsaSecp256k1VerificationKey2019" ||
            auth.type === "EcdsaSecp256k1VerificationKeyImFact2025"
        ) {
            return new AsymKeyAuth(
                auth.id,
                auth.type,
                auth.controller,
                auth.publicKeyImFact
            );
        }
    
        throw MitumError.detail(
            ECODE.DID.INVALID_AUTHENTICATION,
            `Unknown authentication type: ${String((auth as any).type)}`
        );
    }

    private mapAuthToClass(
        el: asymkeyAuth | linkedAuth,
        sender: string | Address
    ): AsymKeyAuth | LinkedAuth {
        this.isSenderDidOwner(sender, el.id, true);
        this.isSenderDidOwner(sender, el.controller);
    
        return this.mapAuth(el);
    }

    /**
     * Creates an AsymKeyAuth object with the provided authentication details.
     * @param {string} id - The unique identifier for the authentication. <did>#<key-id> format.
     * @param {"SECP256K1_2019" | "SECP256K1_IMFACT_2025"} option - Short identifier for verification key type.
     *  - SECP256K1_2019 → EcdsaSecp256k1VerificationKey2019
     *  - SECP256K1_IMFACT_2025 → EcdsaSecp256k1VerificationKeyImFact2025
     * @param {string} controller - The controller responsible for the authentication.
     * @param {string} publicKeyImFact - The public key associated with the authentication.
     * @returns {AsymKeyAuth} An AsymKeyAuth Instance.
     */
    writeAsymkeyAuth(
        id: string,
        option: asymKeyAuthOpt,
        controller: string,
        publicKeyImFact: string,
    ): AsymKeyAuth {
        const verificationType = ASYMKEY_TYPE_MAP[option];
    
        if (!verificationType) {
            throw MitumError.detail(
                ECODE.INVALID_TYPE,
                `Unsupported asym key option: ${option}`
            );
        }
    
        return new AsymKeyAuth(
            id,
            verificationType,
            controller,
            publicKeyImFact
        );
    }

    /**
     * Creates a LinkedAuth object that allows another authentication method
     * (e.g. OAuth provider, biometric service, custody service)
     * to act on behalf of the DID subject with restricted operation capabilities.
     * @param {string} id - The unique identifier of this linked authentication method. <did>#<key-id> format.
     * @param {string} controller - The DID controller that authorizes this linked authentication.
     * @param {string} targetId - The identifier of the authentication method that performs verification on behalf of the DID subject.
     * @param {AllowedOperation[]} allowedOperations - A list of operation capabilities that this linked authentication is permitted to execute on behalf of the DID subject.
     *   Each allowedOperation must be created using {@link Mitum.allowedOperation}, which provides a safe, typed registry of core-supported operations.
     *   Example:
     *   ```ts
     *   const allowed = [
     *     Mitum.allowedOperation.currency.transfer(),
     *     Mitum.allowedOperation.did.create(contract),
     *   ];
     *   ```
     * @returns {LinkedAuth} LinkedAuth instance.
     */
    writeLinkedAuth(
        id: string,
        controller: string,
        targetId: string,
        allowedOperations: AllowedOperation[],
    ): LinkedAuth {
        return new LinkedAuth(
            id,
            controller,
            targetId,
            allowedOperations
        );
    }

    /**
     * The returned Document can be passed directly to `updateDocument()`.
     * @param {Array<string | LongString>} didContext - DID document contexts (e.g. DID Core context, service-specific context).
     * @param {string} didID - DID identifier.
     * @param {Array<AsymKeyAuth | LinkedAuth>} authentications - Authentication methods for the DID.
     * @param {Array<AsymKeyAuth | LinkedAuth>} [verificationMethods] - Verification methods for the DID.
     * @param {Array<Object>} [services] - Optional service definitions.
     * @param {string} services[].id - Service identifier. <did>#<key-id> format.
     * @param {string} services[].type - Service type.
     * @param {string} services[].service_end_point - Service endpoint URL.
     * @returns {Document} DID Document instance.
     */
    writeDocument(
        didContext: string[],
        didID: string,
        authentications: (AsymKeyAuth | LinkedAuth)[],
        verificationMethods: (AsymKeyAuth | LinkedAuth)[] = [],
        service?: {
            id: string;
            type: string;
            service_end_point: string;
        }[]
    ): Document {
        return new Document(
            didContext,
            didID,
            authentications.map((auth, idx) => {
                if (auth instanceof AsymKeyAuth || auth instanceof LinkedAuth) {
                    return auth;
                }
            
                throw MitumError.detail(
                    ECODE.DID.INVALID_AUTHENTICATION,
                    `authentication[${idx}] must be AsymKeyAuth or LinkedAuth instance`
                );
            }),
            verificationMethods.map((auth, idx) => {
                if (auth instanceof AsymKeyAuth || auth instanceof LinkedAuth) {
                    return auth;
                }
            
                throw MitumError.detail(
                    ECODE.DID.INVALID_AUTHENTICATION,
                    `verificationMethods[${idx}] must be AsymKeyAuth or LinkedAuth instance`
                );
            }),
            service
                ? service.map(
                      el =>
                          new Service(
                            el.id,
                            el.type,
                            el.service_end_point
                          )
                  )
                : undefined
        );
    }

    /**
     * Generate a `register-model` operation to register new did registry model on the contract.
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | LongString} [didMethod] - The did method
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @returns `register-model` operation.
     */
    registerModel(
        contract: string | Address,
        sender: string | Address,
        didMethod: string,
        currency: string | CurrencyID,
    ): Operation<RegisterModelFact> {
        return new Operation(
            this.networkID,
            new RegisterModelFact(
                TS.new().UTC(),
                sender,
                contract,
                didMethod,
                currency
            )
        )
    }
    
    /**
     * Generate `create-did` operation to create new did and did document.
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | Address} [sender] - The sender's address.
     * @param {string | CurrencyID} [currency] - The currency ID.
     * @returns `create-did` operation
     */
    create(
        contract: string | Address,
        sender: string | Address,
        currency: string | CurrencyID,
    ): Operation<CreateFact> {
        const fact = new CreateFact(
            TS.new().UTC(),
            sender,
            contract,
            currency
        )
        return new Operation(this.networkID, fact)
    }

    /**
     * Update an Auth DID document using a strongly-typed document object.
     *
     * This method expects the `document` parameter to conform to the SDK's
     * internal `document` type. All authentication entries must already be
     * validated and structurally correct, and will be converted into
     * corresponding class instances (`AsymKeyAuth`, `LinkedAuth`, etc.).
     *
     * Ownership checks are enforced:
     * - The sender must be the owner of the document DID.
     * - The sender must also own any controller or service DID referenced
     *   in the document
     * @param contract - The Auth DID contract address.
     * @param sender - The transaction sender; must be the owner of the document DID.
     * @param document - A validated document object matching the SDK `document` type.
     * @param currency - Currency ID used for the operation fee.
     * @returns An `Operation` instance that can be signed and submitted to the network.
     */
    updateDocument(
        contract: string | Address,
        sender: string | Address,
        document: Document,
        currency: string | CurrencyID,
    ): Operation<UpdateDocumentFact> {
        const normalized = this.normalizeDocument(document, sender);
    
        const fact = new UpdateDocumentFact(
            TS.new().UTC(),
            sender,
            contract,
            normalized.id.toString(),
            normalized,
            currency
        );
    
        return new Operation(this.networkID, fact);
    }

    /**
     * Update an Auth DID document from a raw JSON object.
     *
     * This method accepts an untyped document (e.g. parsed JSON), validates
     * its structure and authentication entries, and converts it into internal
     * SDK classes before creating the operation.
     *
     * Use this method when the document comes from external or untrusted sources.
     * @param contract - The Auth DID contract address.
     * @param sender - The transaction sender; must own the document DID.
     * @param documentJson - A raw JSON object representing an Auth DID document.
     * @param currency - Currency ID used for the operation fee.
     * @returns An `Operation` instance ready to be signed and submitted.
     */
    updateDocumentByDocumentJson(
        contract: string | Address,
        sender: string | Address,
        documentJson: document,
        currency: string | CurrencyID,
    ): Operation<UpdateDocumentFact> {
        const normalized = this.normalizeDocument(documentJson, sender);
    
        const fact = new UpdateDocumentFact(
            TS.new().UTC(),
            sender,
            contract,
            normalized.id.toString(),
            normalized,
            currency
        );
    
        return new Operation(this.networkID, fact);
    }

    /**
     * Get information for did-registry model.
     * @async
     * @param {string | Address} [contract] - The contract's address.
     * @returns `data` of `SuccessResponse` is information of did model:
     * - `_hint`: hint for did model design,
     * - `didMethod`: The did method
     */
    async getModelInfo(contract: string | Address) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        Address.from(contract);
        return await getAPIData(() => contractApi.did.getModel(this.api, contract, this.delegateIP))
    }
    
    /**
     * Get did by account address.
     * @async
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | LongString} [account] - The account address.
     * @returns `data` of `SuccessResponse` is did:
     * - `did`: The did value,
     */
    async getDID(
        contract: string | Address,
        account: string,
    ) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        Address.from(contract);
        Address.from(account);
        const response = await getAPIData(() => contractApi.did.getByAccount(this.api, contract, account, this.delegateIP));
        if (isSuccessResponse(response) && response.data) {
            response.data = response.data.did ? {did: response.data.did} : null;
        }
        return response
    }

    /**
     * Get did document by did.
     * @async
     * @param {string | Address} [contract] - The contract's address.
     * @param {string | LongString} [did] - The did value.
     * @returns `data` of `SuccessResponse` is did document.
     */
    async getDocument(
        contract: string | Address,
        did: string,
    ) {
        Assert.check( this.api !== undefined && this.api !== null, MitumError.detail(ECODE.NO_API, "API is not provided"));
        Address.from(contract);
        validateDID(did);
        const response = await getAPIData(() => contractApi.did.getByDID(
            this.api,
            contract,
            did,
            this.delegateIP,
        ))
        return response
    }
}

export const did = {
    registerModel(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DID.REGISTER_MODEL.OPERATION, contract, true);
    },

    create(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DID.CREATE_DID.OPERATION, contract, true);
    },

    updateDocument(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DID.UPDATE_DID_DOCUMENT.OPERATION, contract, true);
    },
};