import { Hint } from "../../common"
import { HintedObject, IBytes, IHintedObject, IString } from "../../types"

export abstract class Item implements IBytes, IString, IHintedObject {
    private hint: Hint
    
    protected constructor(hint: string) {
        this.hint = new Hint(hint)
    }

    abstract toBytes(): Uint8Array
    abstract toString(): string
    
    toHintedObject(): HintedObject {
        return {
            _hint: this.hint.toString()
        }
    }
}