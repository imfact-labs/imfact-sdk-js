## Abstraction

- __imfact-sdk-js__ is the official JavaScript/TypeScript SDK for the ImFACT blockchain.
- The ImFACT blockchain operates on a __multi-sig account__ basis. However, for user convenience, __single-sig__ is prioritized.
- Method names are designed to be called intuitively from the user's perspective and use camelCase notation for consistency.

<br>

## 1. Install (Recommended)

For all dApp and back-end development, we strongly recommend using the official [npm package](https://www.npmjs.com/package/@imfact/sdk).

This package automatically provides the correct bundle for your environment (Node.js or Browser).

```bash
$ npm install @imfact/sdk
```

</br> 

## 2. Usage

The SDK provides two main classes, which are both available as **named exports**:

`Mitum`: The main SDK class for core logic. Use this to create operations, generate keys, and communicate directly with a blockchain node (via its **API Endpoint**).

`BrowserProvider`: The EIP-1193 standard provider. Use this in dApps to connect to browser wallets like Fact Wallet (window.imfact) for account requests and transaction signing.

</br> 

### A. For Browser Environments (dApps, Vite, React)
Use the ES Module (ESM) bundle via `import`. This bundle **includes necessary browser polyfills** (like Buffer) automatically. You no longer need to configure polyfills in your `vite.config.ts` or perform manual fixes

```jsx
// Example: Connecting to Fact Wallet in a React dApp
import { Mitum, BrowserProvider } from '@imfact/sdk';

// 1. Initialize the Provider by wrapping the wallet's injected object
const provider = new BrowserProvider(window.imfact);

// 2. Request account access (triggers wallet popup)
const accounts = await provider.requestAccounts();
const userAddress = accounts[0];

// 3. Initialize the Mitum core class to create operations
//    This requires the Node's API Endpoint for blockchain queries/submissions.
const mitum = new Mitum("https://testnet.imfact.im"); // API endpoint for imFact Testnet

const recipientAddress = "0x...";
const op = mitum.currency.transfer(userAddress, recipientAddress, "FACT", 100);
const txObject = op.toHintedObject(); // Create the JSON object for the wallet

// 4. Send the transaction object to the wallet for signing
const factHash = await provider.sendTransaction(txObject);
console.log('Transaction Fact Hash:', factHash);

// 5. Listen for wallet events
provider.on('accountsChanged', (newAccounts) => {
  console.log('Wallet accounts changed:', newAccounts);
});
```

</br> 

### B. For Node.js Environments (Back-end, Scripts)
    
Use the CommonJS (CJS) bundle via require. This bundle uses Node.js native modules (like the built-in Buffer) for optimal performance.

⚠️ Warning! The signing method has been changed to an asynchronous API starting from v2.x.x. 
Please refer to the [Breaking Change: Async Signing](#-breaking-change-async-signing) section.

```jsx
// Example: Sending a transaction from a Node.js server
const { Mitum } = require('@imfact/sdk');

// 1. Initialize the Mitum core class with the Node's API Endpoint URL
//    This requires the Node's API Endpoint for blockchain queries/submissions.
const mitum = new Mitum("https://testnet.imfact.im"); // API endpoint for imFact Testnet

// 2. Create and sign an operation
const sender = "0x...";
const privateKey = "...";
const recipientAddress = "0x...";
const op = mitum.currency.transfer(sender, recipientAddress, "FACT", 100);
op.sign(privateKey);

// 3. Send the signed operation directly to the node's API Endpoint
const sendOperation = async () => {
  try {
    const info = await mitum.operation.send(op);
    console.log(info); // Check the operation sended sucessfully.
    const receipt = await info.wait(); // Wait for the transaction to be confirmed
    console.log(receipt);
  } catch (error) {
    console.error("Failed to send operation:", error);
  }
};

sendOperation();
```

<br>

## 3. Important Functions Note

The operation objects created by the SDK (e.g., `mitum.currency.transfer(...)`) are **raw transaction messages**.

- They **require signing** via the `.sign()` method (in Node.js) or a `provider.sendTransaction(-)` request (in browsers).

- A signed operation must be **sent to the network** via the `mitum.operation.send()` function (in Node.js) or `provider.sendTransaction()` (in browsers) to be executed.

<br>

## 4. SDK User Guide
For detailed information on all class, method, and advanced usage, please refer to our official GitBook documentation.

Be sure to check it out before using the SDK.

<a href="https://imfact.gitbook.io/mitum-js-sdk"> 📖 ImFACT SDK user guide </a>

<br>

## 5. Exports Overview

#### Classes
* `Mitum` — Main SDK class for core logic and node communication.
* `BrowserProvider` — EIP-1193 Provider for browser wallet (dApp) communication.

#### Types
* `Fact`, `BaseOperation`, `Item`, `Authentication`, `ProxyPayer`, `Settlement`
* `Account`, `HDAccount`, `defaultPath`

#### Utilities
* `isOpFact(object)`
* `isHintedObject(object)`
* `isHintedObjectFromUserOp(object)`


<br/>

---
<details> <summary><b>Building from Source (For Contributors)</b></summary>

If you need to contribute to the SDK development, you can build it locally.

```Bash
$git clone https://github.com/imfact-labs/imfact-sdk-js.git
$ cd imfact-sdk-js
$ npm install
$ npm run build
```
After building, the dist directory will contain bundle.cjs.cjs (for Node.js testing) and bundle.esm.mjs (for browser testing).

</details>

<br>

## Breaking Change: Async Signing

Starting from v2.x.x, all signing methods are **asynchronous**.

This change was introduced to ensure compatibility across environments (Node.js and Browser) and to align with modern cryptographic libraries such as `@noble/secp256k1`.

### What changed?

* `sign()` is now **async**
* You must use `await` when calling it

#### Before (v1.x.x)

```ts
op.sign(privateKey);
mitum.operation.sign(privatekey, operation);
mitum.signer.sign(privatekey, operation);
```

#### After (v2.x.x)

```ts
await op.sign(privateKey);
await mitum.operation.sign(privatekey, operation);
await mitum.signer.sign(privatekey, operation);
```

### Why this change?

* Modern crypto libraries use **async APIs** for secure randomness and WebCrypto compatibility
* Ensures consistent behavior across:

  * Node.js
  * Browsers
  * Wallet environments

Failing to use `await` may result in:

* incomplete signatures

---

### Updated Node.js Example

```js
// Example: Sending a transaction from a Node.js server
const { Mitum } = require('@imfact/sdk');

const mitum = new Mitum("https://testnet.imfact.im");

const sender = "0x...";
const privateKey = "...";
const recipientAddress = "0x...";
const op = mitum.currency.transfer(sender, recipientAddress, "FACT", 100);

const sendOperation = async () => {
  // must use await
  await op.sign(privateKey);
  
  try {
    const info = await mitum.operation.send(op);
    console.log(info);

    const receipt = await info.wait();
    console.log(receipt);
  } catch (error) {
    console.error("Failed to send operation:", error);
  }
};

sendOperation();
```

---

> Note: All cryptographic operations are now based on `Uint8Array` instead of Node.js `Buffer`, improving compatibility in browser environments. (Applied from version 2.x.x)
