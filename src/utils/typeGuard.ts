import type { BaseOperation } from "../operation/base/operation"
import type { Fact } from "../operation/base/fact"
import { ErrorResponse, SuccessResponse, HintedObject, HintedFactObject } from "../types"
import { Hint } from "../common/hint"
import { Address } from "../key/address"
import { MitumError, ECODE } from "../error"

export const isOpFact = (operation: any): operation is BaseOperation<Fact> => {
  if (typeof operation !== "object" || operation === null) return false;

  const hasRequiredProps =
    "id" in operation &&
    "hint" in operation &&
    "fact" in operation &&
    "_factSigns" in operation &&
    "_hash" in operation;

  if (!hasRequiredProps) return false;

  const isIdValid = typeof operation.id === "string";
  const isHintValid =
    typeof operation.hint === "object" &&
    operation.hint instanceof Hint;

  const isFactValid =
    typeof operation.fact === "object" &&
    operation.fact !== null &&
    'hint' in operation.fact &&
    'token' in operation.fact &&
    '_hash' in operation.fact &&
    operation.fact.hint instanceof Hint

  const isFactSignsValid = Array.isArray(operation._factSigns);
  const isHashValid = operation._hash instanceof Uint8Array

  return (
    isIdValid &&
    isHintValid &&
    isFactValid &&
    isFactSignsValid &&
    isHashValid
  );
};

export const isHintedObject = (object: any): object is HintedObject => {
  if (typeof object !== "object" || object === null) return false;

  if (typeof object._hint !== "string") return false;
  if (typeof object.hash !== "string") return false;
  if (!("fact" in object)) return false;

  const fact = object.fact;
  if (typeof fact !== "object" || fact === null) return false;

  if (typeof fact._hint !== "string") return false;
  if (typeof fact.hash !== "string") return false;
  if (typeof fact.token !== "string") return false;

  if ("sender" in fact && fact.sender !== undefined && typeof fact.sender !== "string")
    return false;

  if ("items" in fact && fact.items !== undefined && !Array.isArray(fact.items))
    return false;
  
  if (!("signs" in object) || !Array.isArray(object.signs)) return false;

  if (
    object.signs.length === 0 ||
    (object.signs.length === 1 && object.signs[0] === "")
  ) {
    return true;
  }

  for (const s of object.signs) {
    if (typeof s !== "object" || s === null) return false;
    if (typeof s.signer !== "string") return false;
    if (typeof s.signature !== "string") return false;
    if ("signed_at" in s && typeof s.signed_at !== "string") return false;
  }

  return true;
};

export const isHintedObjectFromUserOp = (object: any): object is HintedObject => {
  if (!isHintedObject(object)) return false;
  if (
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

// Duck-typed to avoid a circular import on UserOperation (mirrors isOpFact):
// a UserOperation is an operation that additionally carries the AA extension
// fields (auth / settlement).
export const isUserOp = (userOperation: any): userOperation is BaseOperation<Fact> => {
  return isOpFact(userOperation) &&
    "auth" in userOperation &&
    "settlement" in userOperation;
};

export const isHintedFactObject = (obj: unknown): obj is HintedFactObject => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "_hint" in obj &&
    "token" in obj &&
    "hash" in obj
  );
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