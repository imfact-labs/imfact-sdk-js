import type { Account, HDAccount } from "./types"
import { randomN } from "./random"
import { Keys, Key, PubKey } from "./pub"
import { KeyPair } from "./keypair"
import { Address } from "./address"

import { Big, Generator, IP } from "../types"
import { Assert, ECODE, MitumError } from "../error"
import { getChecksum } from "../utils/hash"
import { SUFFIX } from "../alias"


type keysType =
    ({ key: string | Key | PubKey, weight: string | number | Big } | PubKey)[]
    | Array<{ key: string | Key | PubKey; weight: string | number | Big }>

export class KeyG extends Generator {
    constructor(networkID: string, api?: string | IP, delegateIP? : string | IP) {
        super(networkID, api, delegateIP)
    }

    private fillHDwallet(hdwallet: HDAccount): HDAccount {
        return {
            privatekey: hdwallet.privatekey,
            publickey: hdwallet.publickey,
            address: this.address(hdwallet.publickey),
            phrase: hdwallet.phrase,
            path: hdwallet.path,
        }
    }

    /**
     * Generate a key pair randomly or from the given string seed. Avoid using seed ​​that are easy to predict.
	 * @param {string} [seed] - (Optional) The random string seed for deterministic key generation. If not provided, a random key pair will be generated.
	 * @returns An `Account` object with following properties:
	 * - `privatekey`: private key,
	 * - `publickey`: public key,
	 * - `address`: address
     */
    key(seed?: string): Account {
        if (!seed) {
            const kp = KeyPair.random("mitum");
            return {
                privatekey: kp.privateKey.toString(),
                publickey: kp.publicKey.toString(),
                address: this.address(kp.publicKey),
            }
        }

        const kp = KeyPair.fromSeed(seed, "mitum");
        return {
            privatekey: kp.privateKey.toString(),
            publickey: kp.publicKey.toString(),
            address: this.address(kp.publicKey),
        }
    }

    /**
     * Generate `n` length of array with randomly generated key pairs.
	 * @param {number} [n] - The number of accounts to generate.
	 * @returns An array of `Account` objects.
	 * Properties of `Account`:
	 * - `privatekey`: private key,
	 * - `publickey`: public key,
	 * - `address`: address
     */
    keys(n: number): Array<Account> {
        return randomN(n, "mitum").keypairs.map(kp => {
            return <Account>{
                privatekey: kp.privateKey.toString(),
                publickey: kp.publicKey.toString(),
                address: this.address(kp.publicKey),
            }
        })
    }

    /**
     * Generate a key randomly using the HD wallet method. (BIP-32 standard)
	 * @returns An `HDAccount` object with following properties:
	 * - `privatekey`: private key,
	 * - `publickey`: public key,
	 * - `address`: address,
     * - `phrase`: phrases made up of 12 mnemonic words,
     * - `path`: derivation path for HD wallet. Default set to "m/44'/815'/0'/0/0". 815 is a coin type for imFact.
     */
    hdKey(): HDAccount {
        const hdwallet = KeyPair.hdRandom("mitum");
        return this.fillHDwallet(hdwallet)
    }

    /**
     * Generate a key pair from the given private key.
	 * @param {string | Key} [key] - The private key.
	 * @returns An `Account` object with following properties:
	 * - `privatekey`: private key,
	 * - `publickey`: public key,
	 * - `address`: address
     */
    fromPrivateKey(key: string | Key): Account {
        const kp = KeyPair.fromPrivateKey(key);
        return {
            privatekey: kp.privateKey.toString(),
            publickey: kp.publicKey.toString(),
            address: this.address(kp.publicKey),
        }
    }

    /**
     * Generate a key pair from given mnemonic phrase using the HD wallet method.
	 * @param {string} [phrase] - The Mnemonic phrase obtained when executed `hdKey()` method.
     * @param {string} [path] - (Optional) The derivation path for HD wallet.
	 * @returns An `HDAccount` object with following properties:
	 * - `privatekey`: private key,
	 * - `publickey`: public key,
	 * - `address`: address
     * - `phrase`: phrases made up of 12 mnemonic words,
     * - `path`: derivation path for HD wallet, default set to "m/44'/815'/0'/0/0". 815 is a coin type for imFact.
     */
    fromPhrase(phrase: string, path?: string): HDAccount {
        const hdwallet = KeyPair.fromPhrase(phrase, path);
        return this.fillHDwallet(hdwallet)
    }

    /**
     * Generate an address derived the given public key.
	 * @param {string | Key} [key] - The public key.
	 * @returns The address derived from public key
	 */
    address(key: string | Key): string {
        const suffix = key.toString().slice(-3);
        Assert.check(
            suffix === "fpu",
            MitumError.detail(ECODE.INVALID_PUBLIC_KEY, "invalid pubkey format"),
        )
        return new Keys([new PubKey(key, 100)], 100).checksum.toString()
    }

	/**
	 * Returns a checksummed address for given address string. For invalid address, an error is returned.
	 * @param {string} [address] - An address.
	 * @returns A checksummed address.
     */
    checksummedAddress(address: string) {
        try {
            const valid_address = new Address(address);
            return valid_address.toString();
        } catch(error: any) {
            if (error.code === 'EC_INVALID_ADDRESS_CHECKSUM') {
                return '0x' + getChecksum(address.slice(2, 42)) + SUFFIX.ADDRESS.MITUM
            } else {
                throw error
            }
        }
    }

    /**
     * Generate a multi-signature address from the given keys.
	 * @param {keysType} [keys] - An array of object {`key`: publickey, `weight`: weight for the key}
	 * @param {string | number | Big} [threshold] - The threshold for the multi-signature.
	 * @returns The multi-signature address.
	 * @example
	 * const pubkey01 = {
	 *     key: "02cb1d73c49d638d98092e35603414b575f3f5b5ce01162cdd80ab68ab77e50e14fpu",
	 *     weight: 50
	 * };
	 * const pubkey02 = {
	 *     key: "0377241675aabafca6b1a49f3bc08a581beb0daa330a4ac2008464d63ed7635a22fpu",
	 *     weight: 50
	 * };
	 * const mutiSigAddress = mitum.account.addressForMultiSig([pubkey01, pubkey02], 100);
     */
    addressForMultiSig(
        keys: keysType,
        threshold: string | number | Big,
    ): string {
        return new Keys(keys.map(k => k instanceof PubKey ? k : new PubKey(k.key, k.weight)), threshold).checksum.toString()
    }
}

export { Address, Key, Keys, PubKey, KeyPair }