import { getPublicKey } from "@noble/secp256k1"
import { ECODE, MitumError } from "../error"

function hexToBytes(hex: string): Uint8Array {
    if (hex.startsWith("0x")) hex = hex.slice(2)
    if (hex.length % 2 !== 0) throw new Error("Invalid hex length")

    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    }
    return bytes
}

export const privateKeyToPublicKey = (
    privateKey: string | Uint8Array
  ): Uint8Array => {
    let privateBytes: Uint8Array

    if (typeof privateKey === "string") {
      privateBytes = hexToBytes(privateKey)
    } else if (privateKey instanceof Uint8Array) {
      privateBytes = privateKey
    } else {
      throw MitumError.detail(ECODE.INVALID_TYPE, "Expected Uint8Array or hex string")
    }

    return getPublicKey(privateBytes, false)
}

export const compress = (publicKey: Uint8Array): string => {
  const x = publicKey.slice(1, 33)
  const y = publicKey.slice(33)

  const prefix = 0x02 + (y[y.length - 1] % 2)

  const compressed = new Uint8Array(33)
  compressed[0] = prefix
  compressed.set(x, 1)

  let hex = ""
  for (const b of compressed) {
    hex += b.toString(16).padStart(2, "0")
  }

  return hex
}