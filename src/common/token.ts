import { IBytes, IString } from "../types"
import { Assert, ECODE, MitumError } from "../error"
import { bytesToBase64 } from "../utils/base64"

const encoder = new TextEncoder();

export class Token implements IBytes, IString {
  private s: string

  constructor(s: string) {
    Assert.check(s !== "", MitumError.detail(ECODE.INVALID_TOKEN, "empty token"))
    this.s = s
  }

  static from(s: string | Token) {
    return s instanceof Token ? s : new Token(s)
  }

  toBytes(): Uint8Array {
    return encoder.encode(this.s)
  }

  toString(): string {
    return bytesToBase64(this.toBytes())
  }
}