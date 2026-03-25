import base58 from "bs58"
import { Authentication, ProxyPayer, Settlement, GeneralFactSign, NodeFactSign } from "./base"
import type { BaseOperation, Fact, UserOperationJson, OperationJson, SignOption } from "./base"
import { sha3 } from "../utils"
import { Key } from "../key/pub"
import { KeyPair } from "../key/keypair"
import { NodeAddress } from "../key/address"
import { Generator, HintedObject, FullTimeStamp, TimeStamp, IP } from "../types"
import { StringAssert, Assert, ECODE, MitumError } from "../error"
import { isOpFact, isHintedObject, isHintedObjectFromUserOp} from "../utils/typeGuard"
import { concatBytes } from "../utils/bytes"

const encoder = new TextEncoder()

export class Signer extends Generator {

    constructor(
        networkID: string,
        api?: string | IP,
    ) {
        super(networkID, api)
    }
    
    /**
     * Signs the given operation using the provided private key.
     *
     * This method supports both raw Operation instances and JSON representations.
     * Internally, all inputs are normalized into OperationJson format before signing.
     *
     * @param {string | Key} privatekey - The private key used for signing.
     * @param {BaseOperation<Fact> | OperationJson | string} operation - The operation to sign.
     *        Accepts:
     *          - BaseOperation instance
     *          - OperationJson object
     *          - JSON string (parsable to OperationJson)
     * @param {SignOption} [option] - Optional signing options (e.g. node address for NodeFactSign).
     *
     * @returns {Promise<OperationJson>} The signed operation in OperationJson format.
     *
     * @throws {MitumError} If the operation format is invalid or signing fails.
     */
    async sign(
        privatekey: string | Key,
        operation: BaseOperation<Fact> | HintedObject | string,
        option?: SignOption
    ): Promise<OperationJson> {
        if (typeof operation === "string") {
            try {
                operation = JSON.parse(operation);
            } catch {
                throw MitumError.detail(ECODE.INVALID_OPERATION, `input can not be recontructed into HintedObject format`)
            }
        }

        Assert.check(
			isOpFact(operation) || isHintedObject(operation), 
			MitumError.detail(ECODE.INVALID_OPERATION, `input is neither in OP<Fact> nor HintedObject format`)
		)

        let opJson: OperationJson;

        if (isOpFact(operation)) {
            opJson = operation.toHintedObject();
        } else if (isHintedObject(operation)) {
            opJson = operation as OperationJson;
        } else {
            throw MitumError.detail(ECODE.INVALID_OPERATION, "invalid operation type");
        }

        Key.from(privatekey);
        const keypair = KeyPair.fromPrivateKey(privatekey)
        return option 
            ? await this.nodeSign(keypair as KeyPair, opJson, option.node ?? "")
            : await this.accSign(keypair as KeyPair, opJson)
    }

    private async accSign(keypair: KeyPair, operation: OperationJson): Promise<OperationJson> {
        const now = TimeStamp.new()

        const hash = operation.fact.hash;

        Assert.check(
            typeof hash === "string" && hash.length > 0,
            MitumError.detail(ECODE.INVALID_OPERATION, "empty fact hash")
        )

        const msgToSign = concatBytes([
            encoder.encode(this.networkID),
            base58.decode(operation.fact.hash),
            now.toBytes(),
        ])

        const fs = new GeneralFactSign(
            keypair.publicKey.toString(),
            await keypair.sign(msgToSign),
            now.toString(),
        ).toHintedObject()

        if (operation.signs !== undefined) {
            operation.signs = [...operation.signs, fs]
        } else {
            operation.signs = [fs]
        }

        Assert.check(
            new Set(operation.signs.map(fs => fs.signer.toString())).size === operation.signs.length,
            MitumError.detail(ECODE.INVALID_FACTSIGNS, "duplicate signers found in factsigns"),
        )

        const factSigns = operation.signs.map((s) =>
            concatBytes([
                encoder.encode(s.signer),
                base58.decode(s.signature),
                new FullTimeStamp(s.signed_at).toBytes("super"),
            ])
        )

        const msg = concatBytes([
            base58.decode(operation.fact.hash),
            concatBytes(factSigns),
        ])

        if (isHintedObjectFromUserOp(operation as UserOperationJson)) {
            return this.FillUserOpHash(operation as UserOperationJson);
        } 

        operation.hash = base58.encode(sha3(msg))

        return operation
    }


    private async nodeSign(keypair: KeyPair, operation: OperationJson, node: string): Promise<OperationJson> {
        const nd = new NodeAddress(node)
        const now = TimeStamp.new()
        const msgToSign = concatBytes([
            encoder.encode(this.networkID),
            nd.toBytes(),
            base58.decode(operation.fact.hash),
            now.toBytes(),
        ])

        const fs = new NodeFactSign(
            node,
            keypair.publicKey.toString(),
            await keypair.sign(msgToSign),
            now.toString(),
        ).toHintedObject()

        operation.signs = operation.signs ? [...operation.signs, fs] : [fs]
        
        const factSigns = operation.signs
            .map((s) =>
                concatBytes([
                    encoder.encode(s.signer),
                    base58.decode(s.signature),
                    new FullTimeStamp(s.signed_at).toBytes("super"),
                ])
            )
            .sort((a, b) => {
                const len = Math.min(a.length, b.length)
                for (let i = 0; i < len; i++) {
                    if (a[i] !== b[i]) return a[i] - b[i]
                }
                return a.length - b.length
            })

        const msg = concatBytes([
            base58.decode(operation.fact.hash),
            concatBytes(factSigns),
        ])

        operation.hash = base58.encode(sha3(msg))

        return operation
    }

    private FillUserOpHash(userOperation: UserOperationJson): UserOperationJson {
        const { extension } = userOperation;
        const { authentication, settlement, proxy_payer } = extension;
    
        this.validateUserOpFields({ ...authentication, ...settlement, ...proxy_payer });
    
        const hintedExtension = (() => {
            const auth = new Authentication(
                authentication.contract,
                authentication.authentication_id,
                authentication.proof_data
            ).toHintedObject();
            const settlementObj = new Settlement(settlement.op_sender).toHintedObject();
    
            if (proxy_payer) {
                const proxyPayerObj = new ProxyPayer(proxy_payer.proxy_payer).toHintedObject();
                return { authentication: auth, proxy_payer: proxyPayerObj, settlement: settlementObj };
            }
    
            return { authentication: auth, settlement: settlementObj };
        })();
    
        const msg = concatBytes([
            encoder.encode(JSON.stringify(hintedExtension)),
            base58.decode(userOperation.fact.hash),
            concatBytes(userOperation.signs.map((s) =>
                concatBytes([
                    encoder.encode(s.signer),
                    base58.decode(s.signature),
                    new FullTimeStamp(s.signed_at).toBytes("super"),
                ])
            )),
        ]);
    
        userOperation.hash = base58.encode(sha3(msg));
        return userOperation;
    }

    private validateUserOpFields(fields: Record<string, any>): void {
        Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined) {
                StringAssert.with(
                    value,
                    MitumError.detail(ECODE.INVALID_USER_OPERATION, `Cannot sign the user operation: ${key} must not be empty.`)
                ).empty().not().excute();
            }
        });
    }
}