import { Version } from "../node/config"
import { IString } from "../types"

export class Hint implements IString {
    private s: string

    constructor(s: string) {
        this.s = s
    }

    toString(): string {
        return `${this.s}-${Version.get()}`
    }

    static hasVersion(s: string): boolean {
        const suffix = `-${Version.get()}`
        return s.endsWith(suffix)
    }

    static fromString(s: string): Hint {
        if (!Hint.hasVersion(s)) {
            throw new Error(`Invalid hinted string (missing version): ${s}`)
        }
        const suffix = `-${Version.get()}`
        return new Hint(s.slice(0, -suffix.length))
    }
}