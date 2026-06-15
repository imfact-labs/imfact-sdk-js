import { Address } from "../key"
import { AllowedOperation } from "./base"
import { HINT } from "../alias"

const currency = {
    transfer(): AllowedOperation {
        return new AllowedOperation(HINT.CURRENCY.TRANSFER.OPERATION);
    },
};

const account = {
    create(): AllowedOperation {
        return new AllowedOperation(HINT.CURRENCY.CREATE_ACCOUNT.OPERATION);
    },
    updateKey(): AllowedOperation {
        return new AllowedOperation(HINT.CURRENCY.UPDATE_HANDLER.OPERATION);
    },
};

const contract = {
    create(): AllowedOperation {
        return new AllowedOperation(HINT.CURRENCY.CREATE_CONTRACT_ACCOUNT.OPERATION);
    },
    withdraw(): AllowedOperation {
        return new AllowedOperation(HINT.CURRENCY.WITHDRAW.OPERATION);
    },
    updateRecipient(): AllowedOperation {
        return new AllowedOperation(HINT.CURRENCY.UPDATE_RECIPIENT.OPERATION);
    },
    updateHandler(): AllowedOperation {
        return new AllowedOperation(HINT.CURRENCY.UPDATE_HANDLER.OPERATION);
    },
};

const credential = {
    registerModel(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.CREDENTIAL.REGISTER_MODEL.OPERATION, contract, true);
    },
    addTemplate(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.CREDENTIAL.ADD_TEMPLATE.OPERATION, contract, true);
    },
    issue(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.CREDENTIAL.ISSUE.OPERATION, contract, true);
    },
    revoke(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.CREDENTIAL.REVOKE.OPERATION, contract, true);
    },
};

const dao = {
    registerModel(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DAO.REGISTER_MODEL.OPERATION, contract, true);
    },
    updateModelConfig(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DAO.UPDATE_MODEL_CONFIG.OPERATION, contract, true);
    },
    propose(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DAO.PROPOSE.OPERATION, contract, true);
    },
    cancelProposal(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DAO.CANCEL_PROPOSAL.OPERATION, contract, true);
    },
    register(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DAO.REGISTER.OPERATION, contract, true);
    },
    preSnap(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DAO.PRE_SNAP.OPERATION, contract, true);
    },
    postSnap(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DAO.POST_SNAP.OPERATION, contract, true);
    },
    vote(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DAO.VOTE.OPERATION, contract, true);
    },
    execute(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DAO.EXECUTE.OPERATION, contract, true);
    },
};

const nft = {
    registerModel(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.NFT.REGISTER_MODEL.OPERATION, contract, true);
    },
    updateModelConfig(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.NFT.UPDATE_MODEL_CONFIG.OPERATION, contract, true);
    },
    mint(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.NFT.MINT.OPERATION, contract, true);
    },
    approveAll(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.NFT.APPROVE_ALL.OPERATION, contract, true);
    },
    approve(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.NFT.APPROVE.OPERATION, contract, true);
    },
    transfer(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.NFT.TRANSFER.OPERATION, contract, true);
    },
    addSignature(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.NFT.ADD_SIGNATURE.OPERATION, contract, true);
    },
};

const payment = {
    registerModel(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.PAYMENT.REGISTER_MODEL.OPERATION, contract, true);
    },
    deposit(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.PAYMENT.DEPOSIT.OPERATION, contract, true);
    },
    updateAccountSetting(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.PAYMENT.UPDATE_ACCOUNT_SETTING.OPERATION, contract, true);
    },
    withdraw(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.PAYMENT.WITHDRAW.OPERATION, contract, true);
    },
    transfer(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.PAYMENT.REGISTER_MODEL.OPERATION, contract, true);
    },
};

const point = {
    registerModel(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.POINT.REGISTER_MODEL.OPERATION, contract, true);
    },
    mint(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.POINT.MINT.OPERATION, contract, true);
    },
    transfer(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.POINT.TRANSFER.OPERATION, contract, true);
    },
    approve(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.POINT.APPROVE.OPERATION, contract, true);
    },
    burn(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.POINT.BURN.OPERATION, contract, true);
    },
    transferFrom(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.POINT.TRANSFER_FROM.OPERATION, contract, true);
    },
};

const storage = {
    registerModel(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.STORAGE.REGISTER_MODEL.OPERATION, contract, true);
    },
    createData(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.STORAGE.CREATE_DATA.OPERATION, contract, true);
    },
    deleteData(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.STORAGE.DELETE_DATA.OPERATION, contract, true);
    },
    updateData(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.STORAGE.UPDATE_DATA.OPERATION, contract, true);
    },
};

const timestamp = {
    registerModel(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.TIMESTAMP.REGISTER_MODEL.OPERATION, contract, true);
    },
    issue(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.TIMESTAMP.ISSUE.OPERATION, contract, true);
    },
};

const token = {
    registerModel(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.TOKEN.REGISTER_MODEL.OPERATION, contract, true);
    },
    mint(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.TOKEN.MINT.OPERATION, contract, true);
    },
    transfer(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.TOKEN.TRANSFER.OPERATION, contract, true);
    },
    approve(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.TOKEN.APPROVE.OPERATION, contract, true);
    },
    burn(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.TOKEN.BURN.OPERATION, contract, true);
    },
    transferFrom(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.TOKEN.TRANSFER_FROM.OPERATION, contract, true);
    },
};

export const did = {
    registerModel(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DID.REGISTER_MODEL.OPERATION, contract, true);
    },

    create(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DID.CREATE_DID.OPERATION, contract, true);
    },

    updateDocument(contract: string | Address): AllowedOperation {
        return new AllowedOperation(HINT.DID.UPDATE_DID_DOCUMENT.OPERATION, contract, true);
    },
};

export const allowedOperation = {
    currency,
    account,
    contract,
    did,
    credential,
    dao,
    nft,
    payment,
    point,
    storage,
    timestamp,
    token,
} as const;
