import { concatBytes } from "./bytes";

const encoder = new TextEncoder();
const MESSAGE_PREFIX = "\x19ImFACT Signed Message:\n";

export function encodePersonalMessage(message: string): Uint8Array {
    const msg = encoder.encode(message);
    const prefix = encoder.encode(MESSAGE_PREFIX + msg.length.toString());

    return concatBytes([prefix, msg]);
}