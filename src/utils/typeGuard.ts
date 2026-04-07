import { Operation as OP, Fact, UserOperation, FactJson } from "../operation/base"
import { MitumError, ECODE } from "../error"
import { ErrorResponse, SuccessResponse, HintedObject } from "../types" 
import { Address } from "../key"

export const isOpFact = (operation: any): operation is OP<Fact> => {
    return operation instanceof OP;
}

export const isHintedObject = (object: any): object is HintedObject => {
    return '_hint' in object && 'fact' in object && 'hash' in object;
}

export const isUserOp = (userOperation: any): userOperation is UserOperation<Fact> => {
    return userOperation instanceof UserOperation;
}

export const isHintedObjectFromUserOp = (object: any): object is HintedObject => {
    if (
        '_hint' in object &&
        'fact' in object &&
        'hash' in object &&
        'extension' in object
    ) {
        const { authentication, settlement, proxy_payer } = object.extension;
        return (
            '_hint' in authentication &&
            'contract' in authentication &&
            'authentication_id' in authentication &&
            'proof_data' in authentication &&
            '_hint' in settlement &&
            'op_sender' in settlement &&
            (proxy_payer ? '_hint' in proxy_payer && 'proxy_payer' in proxy_payer : true)
        );
    }
    return false;
};

export const isErrorResponse = (response: ErrorResponse | SuccessResponse): response is ErrorResponse => {
    return 'error_code' in response;
}

export const isSuccessResponse = (response: ErrorResponse | SuccessResponse): response is SuccessResponse => {
    return 'data' in response;
}

export const isBase58Encoded = (value: string): boolean => {
    if (!value || typeof value !== 'string') {
        return false;
    }
    const base58Chars = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
    return base58Chars.test(value);
}

const invalidDid = (value: string, reason: string) => {
    throw MitumError.detail(
        ECODE.DID.INVALID_DID,
        `Invalid DID: "${value}" (${reason})`
    );
};

export const validateDID = (did: string, id?: boolean): Address => {
    if (typeof did !== "string" || did.length === 0) {
        invalidDid(String(did), "value must be a non-empty string");
    }

    const parts = did.split(":");

    if (parts.length !== 3) {
        invalidDid(did, `expected format "did:<method>:<identifier>"`);
    }

    if (parts[0] !== "did") {
        invalidDid(did, `must start with "did:"`);
    }

    if (id) {
        const hashCount = (did.match(/#/g) || []).length;
        if (hashCount !== 1) {
            invalidDid(
                did,
                `authentication id (or service id) must contain exactly one "#" (did#key)`
            );
        }

        const subparts = parts[2].split("#");
        if (subparts.length !== 2 || !subparts[0] || !subparts[1]) {
            invalidDid(
                did,
                `invalid authentication (or service id) id format, expected "<did>#<key-id>"`
            );
        }

        return Address.from(subparts[0]);
    }

    return Address.from(parts[2]);
};

export const isFactJson = (obj: unknown): obj is FactJson => {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "_hint" in obj &&
        "token" in obj &&
        "hash" in obj
    );
}