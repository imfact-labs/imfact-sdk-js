import { HINT } from "../../alias"
import { Hint } from "../../common"
import { HintedObject, IBuffer, IHintedObject, LongString } from "../../types"
import { Key, PubKey } from "../../key"
import { Assert, MitumError, ECODE } from "../../error"
import { validateDID } from "../../utils/typeGuard"
import { AllowedOperation } from "../base"

import base58 from "bs58";
import * as secp256k1 from "@noble/secp256k1";

const SECP256K1_PUB_PREFIX = new Uint8Array([0xe7, 0x01]);

abstract class Authentication implements IBuffer, IHintedObject {
    private hint: Hint

    constructor(hint: string) {
        this.hint = new Hint(hint)
    }

    toBuffer(): Buffer {
        return Buffer.from([])
    }

    toHintedObject(): HintedObject {
        return {
            _hint: this.hint.toString(),
        }
    }
}

export class AsymKeyAuth extends Authentication {
    readonly id: LongString;
    readonly type: "Ed25519VerificationKey2020" | "EcdsaSecp256k1VerificationKey2019" | "EcdsaSecp256k1VerificationKeyImFact2025";
    readonly controller: LongString;
    readonly publicKey: Key;
    readonly publicKeyMultibase: undefined | string;

    constructor(
        id: string | LongString, 
        type: "Ed25519VerificationKey2020" | "EcdsaSecp256k1VerificationKey2019" | "EcdsaSecp256k1VerificationKeyImFact2025", 
        controller: string | LongString,
        publicKey: string | Key
    ) {
        super(HINT.AUTH_DID.AUTHENTICATION);
        this.id = LongString.from(id);
        validateDID(this.id.toString(), true);
        this.type = type;
        this.controller = LongString.from(controller);
        this.publicKey = new PubKey(publicKey, 100);
        this.publicKeyMultibase = this.type == "EcdsaSecp256k1VerificationKey2019" ? this.setPublicKeyMultibase(this.publicKey.toString()) : undefined;
    }

    private setPublicKeyMultibase(pubKey: string): string {
        const hex = Key.from(pubKey).noSuffix;
    
        let compressed: Uint8Array;
        try {
            compressed = Uint8Array.from(Buffer.from(hex, "hex"));
        } catch {
            throw MitumError.detail(ECODE.INVALID_PUBLIC_KEY, "invalid hex public key");
        }
    
        if (compressed.length !== 33) {
            throw MitumError.detail(ECODE.INVALID_PUBLIC_KEY, "invalid compressed secp256k1 public key length");
        }
    
        let normalizedCompressed: Uint8Array;
        try {
            const point = secp256k1.Point.fromHex(compressed);
            normalizedCompressed = point.toRawBytes(true); // compressed
        } catch {
            throw MitumError.detail(ECODE.INVALID_PUBLIC_KEY, "invalid secp256k1 public key");
        }
    
        const data = new Uint8Array(SECP256K1_PUB_PREFIX.length + normalizedCompressed.length);
        data.set(SECP256K1_PUB_PREFIX, 0);
        data.set(normalizedCompressed, SECP256K1_PUB_PREFIX.length);
    
        return "z" + base58.encode(data);
    }

    toBuffer(): Buffer {
        return Buffer.concat([
            super.toBuffer(),
            this.id.toBuffer(),
            Buffer.from(this.type),
            this.controller.toBuffer(),
            ...(this.publicKeyMultibase
                ? [Buffer.from(this.publicKeyMultibase)]
                : []),
            Buffer.from(this.publicKey.toString()),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            id: this.id.toString(),
            controller: this.controller.toString(),
            type: this.type.toString(),
            ...(this.publicKeyMultibase
                ? { publicKeyMultibase: this.publicKeyMultibase }
                : {}),
            publicKeyImFact: this.publicKey.toString(),
        }
    }

    toString(): string {
        return this.id.toString()
    }
}

export class LinkedAuth extends Authentication {
    readonly id: LongString;
    readonly type: "LinkedVerificationMethod";
    readonly controller: LongString;
    readonly targetId: LongString;
    readonly allowed: AllowedOperation[];

    constructor(
        id: string | LongString,
        controller: string | LongString,
        targetId: string | LongString,
        allowed: AllowedOperation[]
    ) {
        super(HINT.AUTH_DID.AUTHENTICATION);
        this.id = LongString.from(id);
        validateDID(this.id.toString(), true);
        this.type = "LinkedVerificationMethod";
        this.controller = LongString.from(controller);
        this.targetId = LongString.from(targetId);
        validateDID(this.id.toString(), true);
        this.allowed = allowed.map((el, idx) => {
            if (el instanceof AllowedOperation) {
                return el;
            }
        
            try {
                return new AllowedOperation(
                    (el as any).operation,
                    (el as any).contract,
                );
            } catch (e) {
                throw MitumError.detail(
                    ECODE.INVALID_TYPE,
                    `allowed[${idx}] cannot be converted to AllowedOperation: ${JSON.stringify(el)}`
                );
            }
        });
    }

    toBuffer(): Buffer { 
        return Buffer.concat([
            super.toBuffer(), 
            this.id.toBuffer(), 
            Buffer.from(this.type), 
            this.controller.toBuffer(), 
            this.targetId.toBuffer(), 
            Buffer.concat(this.allowed.map((a) => a.toBuffer())),
        ]);
    }

    toHintedObject(): HintedObject {
        return {
            ...super.toHintedObject(),
            id: this.id.toString(),
            controller: this.controller.toString(),
            type: this.type,
            targetId: this.targetId.toString(),
            allowed: this.allowed.map((a) => a.toHintedObject()),
        };
    }

    toString(): string {
        return this.id.toString();
    }
}

export class Service implements IBuffer, IHintedObject {
    readonly id: LongString;
    readonly type: LongString;
    readonly service_end_point: LongString;

    constructor(
        id: string | LongString,
        type: string | LongString,
        service_end_point: string | LongString
    ) {
        this.id = LongString.from(id);
        this.type = LongString.from(type);
        this.service_end_point = LongString.from(service_end_point);
    }

    toBuffer(): Buffer {
        return Buffer.concat([
            this.id.toBuffer(),
            this.type.toBuffer(),
            this.service_end_point.toBuffer(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            id: this.id.toString(),
            type: this.type.toString(),
            service_end_point: this.service_end_point.toString(),
        }
    }
}

export class Document implements IBuffer, IHintedObject {
    private hint: Hint;
    readonly context: LongString[];
    readonly id: LongString;
    readonly authentication: (AsymKeyAuth | LinkedAuth)[];
    readonly verificationMethod: (AsymKeyAuth | LinkedAuth)[];
    readonly service?: Service[];

    constructor(
        context: string | LongString | (string | LongString)[],
        id: string | LongString,
        authentication: (AsymKeyAuth | LinkedAuth)[],
        verificationMethod: (AsymKeyAuth | LinkedAuth)[],
        service?: Service[]
    ) {
        this.hint = new Hint(HINT.AUTH_DID.DOCUMENT);
        const contexts = Array.isArray(context) ? context : [context];
        this.context = contexts.map(ctx => LongString.from(ctx));
        this.id = LongString.from(id);
        validateDID(this.id.toString());

        Assert.check(
            new Set(authentication.map(i => i.toString())).size === authentication.length,
            MitumError.detail(
                ECODE.AUTH_DID.INVALID_DOCUMENT,
                "duplicate authentication id found in authentication"
            )
        );
        this.authentication = authentication;
        Assert.check(
            new Set(verificationMethod.map(i => i.toString())).size === verificationMethod.length,
            MitumError.detail(
                ECODE.AUTH_DID.INVALID_DOCUMENT,
                "duplicate authentication id found in verificationMethod"
            )
        );
        this.verificationMethod = verificationMethod;

        if (service !== undefined) {
            Assert.check(
                Array.isArray(service) && service.every(s => s instanceof Service),
                MitumError.detail(
                    ECODE.AUTH_DID.INVALID_DOCUMENT,
                    "service must be an array of Service"
                )
            );
            this.service = service;
        }
    }

    toBuffer(): Buffer {      
        return Buffer.concat([
            Buffer.concat(this.context.map(ctx => ctx.toBuffer())),
            this.id.toBuffer(),
            Buffer.concat(this.authentication.map(el => Buffer.concat([el.toBuffer(), Buffer.from([1])]))),
            Buffer.concat(this.verificationMethod.map(el => el.toBuffer())),
            ...(this.service
                ? [Buffer.concat(this.service.map(s => s.toBuffer()))]
                : []),
        ]);
    }

    toHintedObject(): HintedObject {
        const obj: any = {
            _hint: this.hint.toString(),
            "@context": this.context.map(ctx => ctx.toString()),
            id: this.id.toString(),
            authentication: this.authentication.map(el => el.toHintedObject()),
            verificationMethod: this.verificationMethod.map(el => el.toHintedObject()),
        };

        if (this.service) {
            obj.service = this.service.map(s => s.toHintedObject());
        } else {
            obj.service = [];
        }

        return obj;
    }
}
