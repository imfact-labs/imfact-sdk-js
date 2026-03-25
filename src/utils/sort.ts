import { IBytes } from "../types"

const compareBytes = (a: Uint8Array, b: Uint8Array): number => {
    const len = Math.min(a.length, b.length)

    for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) {
            return a[i] - b[i]
        }
    }

    return a.length - b.length
}

export const SortFunc = <T extends IBytes, U extends IBytes>(a: T, b: U) =>
    compareBytes(a.toBytes(), b.toBytes())