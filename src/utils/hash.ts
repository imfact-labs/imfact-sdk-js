import { sha3_256, keccak256 as keccak_256 } from "js-sha3"
import { sha256 as nobleSha256 } from "@noble/hashes/sha256"

type Bytes = Uint8Array
type HashInput = string | Uint8Array

const encoder = new TextEncoder()

function toBytes(msg: HashInput): Bytes {
    return typeof msg === "string" ? encoder.encode(msg) : msg
}

export const sha256 = (msg: HashInput): Bytes => {
    return nobleSha256(toBytes(msg))
}

export const sha3 = (msg: HashInput): Bytes => {
    return new Uint8Array(sha3_256.create().update(toBytes(msg)).digest())
}

export const keccak256 = (msg: HashInput): Bytes => {
    return new Uint8Array(keccak_256.create().update(toBytes(msg)).digest())
}

export const getChecksum = (hex: string): string => {
    const hexLower = hex.toLowerCase()

    const hashBytes = keccak256(encoder.encode(hexLower))

    let hashHex = ""
    for (const b of hashBytes) {
        hashHex += b.toString(16).padStart(2, "0")
    }

    let checksum = ""
    for (let i = 0; i < hexLower.length; i++) {
        checksum += parseInt(hashHex[i], 16) > 7
        ? hexLower[i].toUpperCase()
        : hexLower[i]
    }

    return checksum
}