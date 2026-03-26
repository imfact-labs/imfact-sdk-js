## Abstraction

* **imfact-sdk-js** is the official JavaScript/TypeScript SDK for the ImFACT blockchain.
* The ImFACT blockchain operates on a **multi-sig account** basis. However, for user convenience, **single-sig** is prioritized.
* Method names are designed to be called intuitively from the user's perspective and use camelCase notation for consistency.

<br>

## 1. Install (Recommended)

For all dApp and back-end development, we strongly recommend using the official [npm package](https://www.npmjs.com/package/@imfact/account-abstraction).

This package automatically resolves and provides the correct bundle for your environment (**Node.js or Browser**).

```bash
$ npm install @imfact/account-abstraction
```

</br> 

## 2. Usage

The SDK provides the following main class as a **named export**:

`Mitum`: The core SDK class. Use this to create operations, generate keys, and communicate directly with a blockchain node (via its **API Endpoint**).

</br> 

### A. Browser Environments (dApps, Vite, React)

Use ES Modules via `import`. The SDK will automatically resolve the browser-compatible bundle (`dist/bundle.esm.mjs`).

No additional polyfills (e.g., Buffer) are required.

```tsx
// Example: Using Mitum in a browser environment
import { Mitum } from '@imfact/account-abstraction';

const mitum = new Mitum("https://testnet.imfact.im");

const sender = "0x...";
const receiver = "0x...";
const privateKey = "...";

const run = async () => {
  const op = mitum.currency.transfer(sender, receiver, "FACT", 100);

  // ⚠️ Async signing (v2.x.x and above)
  await op.sign(privateKey);

  console.log(op.toHintedObject());
};

run();
```

</br> 

### B. Node.js Environments (Back-end, Scripts)

Use the CommonJS (CJS) bundle via `require`.

```js
// Example: Sending a transaction from a Node.js server
const { Mitum } = require('@imfact/account-abstraction');

// 1. Initialize the Mitum core class
const mitum = new Mitum("https://testnet.imfact.im");

// 2. Create operation
const sender = "0x...";
const privateKey = "...";
const recipientAddress = "0x...";
const op = mitum.currency.transfer(sender, recipientAddress, "FACT", 100);

// 3. Sign and send
const sendOperation = async () => {
  try {
    // ⚠️ Async signing (v2.x.x and above)
    await op.sign(privateKey);

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

<br>

## 3. Important Functions Note

The operation objects created by the SDK (e.g., `mitum.currency.transfer(...)`) are **raw transaction messages**.

* They **must be signed asynchronously** using `.sign()`
  → Always use `await`

* A signed operation must be **sent to the network** via `mitum.operation.send()` to be executed.

<br>

## 4. ⚠️ Breaking Change: Async Signing

Starting from **v2.0.0**, all signing-related methods are **asynchronous**.

This includes:

* `operation.sign(...)`
* `signer.sign(...)`
* `userOperation.addAlterSign(...)`

```js
// ❌ Incorrect (will cause unexpected errors)
op.sign(privateKey);

// ✅ Correct
await op.sign(privateKey);
```

Failing to use `await` may result in:

* Missing signatures
* Empty `proof_data`
* Invalid operation errors during `send`

<br>

## 5. SDK User Guide

For detailed information on all classes, methods, and advanced usage, please refer to our official GitBook documentation.

<a href="https://imfact.gitbook.io/mitum-js-sdk/account-abstraction"> 📖 ImFACT SDK user guide </a>

<br>

## 6. Exports Overview

#### Classes

* `Mitum` — Main SDK class for core logic and node communication.

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

```bash
$ git clone https://github.com/imfact-labs/imfact-sdk-js.git
$ cd imfact-sdk-js
$ git pull origin account-abstraction
$ npm install
$ npm run build
```

After building, the `dist` directory will contain:

* `bundle.cjs.cjs` (Node.js)
* `bundle.esm.mjs` (Browser)

</details>