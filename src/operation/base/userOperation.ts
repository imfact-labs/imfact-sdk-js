import { isBase58Encoded } from "../../utils/typeGuard"
import { Hint } from "../../common"
import { HINT } from "../../alias"
import { Assert, ECODE, MitumError } from "../../error"
import { Address } from "../../key/address"
import { HintedObject, IHintedObject } from "../../types"

//type FactSign = GeneralFactSign | NodeFactSign

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