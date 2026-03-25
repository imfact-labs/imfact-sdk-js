export function bytesToBase64(bytes: Uint8Array): string {
    if (typeof Buffer !== "undefined") {
        return Buffer.from(bytes).toString("base64");
    }

    let binary = "";
    for (const b of bytes) {
        binary += String.fromCharCode(b);
    }
    return btoa(binary);
}

export const base64ToBytes = (b64: string): Uint8Array => {
    if (typeof atob !== "undefined") {
        return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    } else {
        return Uint8Array.from(Buffer.from(b64, "base64"));
    }
};

export const bytesToUtf8 = (bytes: Uint8Array): string => {
    return new TextDecoder().decode(bytes);
};