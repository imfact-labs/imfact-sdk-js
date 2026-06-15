type FS = {
    node?: string,
    signer: string,
    signed_at: string,
    signature: string,
}

export type GeneralFS = {
    signer: string,
    signed_at: string,
    signature: string,
}

export type NodeFS = {
    node: string,
    signer: string,
    signed_at: string,
    signature: string,
}

export type FactJson = {
    _hint: string,
    token: string,
    hash: string,
    [i: string]: any,
}

export type Allowed =
    | { operation: string }
    | { operation: string; contract: string };

export type OperationJson = {
    _hint: string,
    fact: FactJson,
    hash: string,
    signs: FS[]
}

type AuthJson = {
    _hint: string,
    contract: string,
    authentication_id: string,
    proof_data: string
}

type ProxyPayerJson = {
    _hint: string,
    proxy_payer: string
}

type SettlementJson = {
    _hint: string,
    op_sender: string
}

export type UserOperationJson = {
    _hint: string,
    fact: FactJson,
    extension: {
        authentication: AuthJson,
        proxy_payer?: ProxyPayerJson,
        settlement: SettlementJson,
    }
    hash: string,
    signs: FS[]
}

export type SignOption = {
    node?: string
}