import { Hint } from "../../common";
import { Address } from "../../key";
import { Allowed } from "./types";
import { MitumError, ECODE } from "../../error";
import { concatBytes } from "../../utils/bytes";

const encoder = new TextEncoder();

export class AllowedOperation {
        readonly contract?: Address;
        readonly operationHint: Hint;
    
        constructor(
            operationHint: string,
            contract?: string | Address,
            requireContract: boolean = false,
        ) {
            this.operationHint =
                Hint.hasVersion(operationHint)
                    ? Hint.fromString(operationHint)
                    : new Hint(operationHint);
    
            if (requireContract && !contract) {
                throw MitumError.detail(
                    ECODE.INVALID_ADDRESS,
                    "Contract address is required for this operation."
                );
            }
    
            this.contract = contract
                ? contract instanceof Address
                    ? contract
                    : new Address(contract)
                : undefined;
        }
    
        toBytes(): Uint8Array {
            if (!this.contract) {
                return encoder.encode(this.operationHint.toString());
            }
    
            return concatBytes([
                this.contract.toBytes(),
                encoder.encode(this.operationHint.toString())
            ]);
        }
    
        toHintedObject(): Allowed {
            if (!this.contract) {
                return {
                    operation: this.operationHint.toString()
                };
            }
    
            return {
                contract: this.contract.toString(),
                operation: this.operationHint.toString()
            };
        }
    }