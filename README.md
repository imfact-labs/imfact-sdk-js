## Abstraction

- __imfact-sdk-js__ is the official JavaScript/TypeScript SDK for the ImFACT blockchain.
- The ImFACT blockchain operates on a __multi-sig account__ basis. However, for user convenience, __single-sig__ is prioritized.
- Method names are designed to be called intuitively from the user's perspective and use camelCase notation for consistency.

<br>

## 1. Install (Recommended)

For all dApp and back-end development, we strongly recommend using the official [npm package](https://www.npmjs.com/package/@imfact/account-abstraction).

This package automatically provides the correct bundle for your environment (Node.js).

```bash
$ npm install @imfact/account-abstraction
```

</br> 

## 2. Usage

The SDK provides two main classes, which are both available as **named exports**:

`Mitum`: The main SDK class for core logic. Use this to create operations, generate keys, and communicate directly with a blockchain node (via its **API Endpoint**).

</br> 

### Node.js Environments (Back-end, Scripts)
    
Use the CommonJS (CJS) bundle via require. This bundle uses Node.js native modules (like the built-in Buffer) for optimal performance.

```jsx
// Example: Sending a transaction from a Node.js server
const { Mitum } = require('@imfact/account-abstraction');

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

- They **require signing** via the `.sign()` method (in Node.js).

- A signed operation must be **sent to the network** via the `mitum.operation.send()` function to be executed.

<br>

## 4. SDK User Guide
For detailed information on all class, method, and advanced usage, please refer to our official GitBook documentation.

Be sure to check it out before using the SDK.

<a href="https://imfact.gitbook.io/mitum-js-sdk/account-abstraction"> 📖 ImFACT SDK user guide </a>

<br>

## 5. Exports Overview

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

If you need to contribute to the SDK development, you can build it locally.

```Bash
$git clone https://github.com/imfact-labs/imfact-sdk-js.git
$ cd imfact-sdk-js
$ git pull origin account-abstraction
$ npm install
$ npm run build
```
After building, the dist directory will contain bundle.cjs.cjs (for Node.js testing).

</details>