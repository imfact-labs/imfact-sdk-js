export type Bytes = Uint8Array;

export function isBytes(data: unknown): data is Uint8Array {
  return (
    data instanceof Uint8Array ||
    (typeof data === "object" &&
      data !== null &&
      "buffer" in data &&
      "byteLength" in data)
  );
}

export function toBytes(data: Bytes | Buffer | string): Bytes {
  if (isBytes(data)) return new Uint8Array(data);
  if (typeof data === "string") {
    return hexToBytes(data);
  }
  return new Uint8Array(data);
}

export function concatBytes(arrays: Bytes[]): Bytes {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);

  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }

  return result;
}

export function hexToBytes(hex: string): Bytes {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex length");
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
}