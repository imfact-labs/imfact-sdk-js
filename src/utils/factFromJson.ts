import { Fact } from "../operation/base"
import { Amount, Fee } from "../common"
import { HINT } from "../alias"
import { Keys, PubKey } from "../key/pub"

// ── Currency ───────────────────────────────────────────────────────────
import { MintFact as CurrencyMintFact } from "../operation/currency/mint"
import { TransferFact as CurrencyTransferFact, TransferItem as CurrencyTransferItem } from "../operation/currency/transfer"
import { WithdrawFact as CurrencyWithdrawFact, WithdrawItem as CurrencyWithdrawItem } from "../operation/currency/withdraw"
import { CreateAccountFact, CreateAccountItem } from "../operation/currency/create-account"
import { CreateContractAccountFact, CreateContractAccountItem } from "../operation/currency/create-contract-account"
import { UpdateKeyFact } from "../operation/currency/update-key"
import { UpdateHandlerFact } from "../operation/currency/update-handler"

// ── Token ──────────────────────────────────────────────────────────────
import { RegisterModelFact as TokenRegisterModelFact } from "../operation/token/register-model"
import { MintFact as TokenMintFact } from "../operation/token/mint"
import { BurnFact as TokenBurnFact } from "../operation/token/burn"
import { TransferFact as TokenTransferFact, TransferItem as TokenTransferItem } from "../operation/token/transfer"
import { ApproveFact as TokenApproveFact, ApproveItem as TokenApproveItem } from "../operation/token/approve"
import { TransferFromFact as TokenTransferFromFact, TransferFromItem as TokenTransferFromItem } from "../operation/token/transfer-from"

// ── Storage ────────────────────────────────────────────────────────────
import { RegisterModelFact as StorageRegisterModelFact } from "../operation/storage/resgister-model"
import { CreateDataFact, CreateDataItem } from "../operation/storage/create-data"
import { UpdateDataFact, UpdateDataItem } from "../operation/storage/update-data"
import { DeleteDataFact } from "../operation/storage/delete-data"

// ── Credential ─────────────────────────────────────────────────────────
import { RegisterModelFact as CredentialRegisterModelFact } from "../operation/credential/register-model"
import { AddTemplateFact } from "../operation/credential/add-template"
import { IssueFact as CredentialIssueFact, IssueItem as CredentialIssueItem } from "../operation/credential/issue"
import { RevokeFact, RevokeItem } from "../operation/credential/revoke"

// ── DAO ────────────────────────────────────────────────────────────────
import { RegisterModelFact as DAORegisterModelFact } from "../operation/dao/register-model"
import { UpdateModelConfigFact as DAOUpdateModelConfigFact } from "../operation/dao/update-model-config"
import { ProposeFact } from "../operation/dao/propose"
import { CancelProposalFact } from "../operation/dao/cancel-proposal"
import { RegisterFact as DAORegisterFact } from "../operation/dao/register"
import { PreSnapFact } from "../operation/dao/pre-snap"
import { PostSnapFact } from "../operation/dao/post-snap"
import { VoteFact } from "../operation/dao/vote"
import { ExecuteFact } from "../operation/dao/execute"
import { DAOPolicy } from "../operation/dao/policy"
import { Whitelist } from "../operation/dao/whitelist"
import { CryptoProposal, BizProposal, TransferCalldata, GovernanceCalldata } from "../operation/dao/proposal"

// ── NFT ────────────────────────────────────────────────────────────────
import { RegisterModelFact as NFTRegisterModelFact } from "../operation/nft/register-model"
import { UpdateModelConfigFact as NFTUpdateModelConfigFact } from "../operation/nft/update-model-config"
import { MintFact as NFTMintFact, MintItem as NFTMintItem } from "../operation/nft/mint"
import { ApproveAllFact, ApproveAllItem } from "../operation/nft/approve-all"
import { ApproveFact as NFTApproveFact, ApproveItem as NFTApproveItem } from "../operation/nft/approve"
import { TransferFact as NFTTransferFact, TransferItem as NFTTransferItem } from "../operation/nft/transfer"
import { AddSignatureFact, AddSignatureItem } from "../operation/nft/add-signature"
import { Signer, Signers } from "../operation/nft/signer"

// ── Payment ────────────────────────────────────────────────────────────
import { RegisterModelFact as PaymentRegisterModelFact } from "../operation/payment/resgister-model"
import { DepositFact } from "../operation/payment/deposit"
import { TransferFact as PaymentTransferFact } from "../operation/payment/transfer"
import { WithdrawFact as PaymentWithdrawFact } from "../operation/payment/withdraw"
import { UpdateFact as PaymentUpdateFact } from "../operation/payment/update-account-setting"

// ── Point ──────────────────────────────────────────────────────────────
import { RegisterModelFact as PointRegisterModelFact } from "../operation/point/register-model"
import { MintFact as PointMintFact } from "../operation/point/mint"
import { TransferFact as PointTransferFact, TransferItem as PointTransferItem } from "../operation/point/transfer"
import { ApproveFact as PointApproveFact, ApproveItem as PointApproveItem } from "../operation/point/approve"
import { BurnFact as PointBurnFact } from "../operation/point/burn"
import { TransferFromFact as PointTransferFromFact, TransferFromItem as PointTransferFromItem } from "../operation/point/transfer-from"

// ── Timestamp ──────────────────────────────────────────────────────────
import { RegisterModelFact as TimestampRegisterModelFact } from "../operation/timestamp/resgister-model"
import { IssueFact as TimestampIssueFact } from "../operation/timestamp/issue"

/**
 * Decodes the base64-encoded token back to the raw token string.
 *
 * Background: Token.toString() returns bytesToBase64(TextEncoder.encode(rawString)),
 * so toHintedObject() stores the token as base64. Constructors expect the raw
 * string, so we must reverse the encoding here.
 */
function decodeBase64Token(base64: string): string {
    if (typeof Buffer !== "undefined") {
        return Buffer.from(base64, "base64").toString("utf8")
    }
    // Browser fallback
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
}

/** Reconstruct Amount instances from Amount.toHintedObject() JSON. */
function amountsFromJson(amountsJson: any[]): Amount[] {
    return amountsJson.map(a => new Amount(a.currency, a.amount))
}

/** Reconstruct Keys from Keys.toHintedObject() JSON: { keys: [{key, weight}], threshold }. */
function keysFromJson(keysJson: any): Keys {
    return new Keys(
        (keysJson.keys as any[]).map(k => new PubKey(k.key, k.weight)),
        keysJson.threshold,
    )
}

/** Reconstruct NFT Signers from Signers.toHintedObject() JSON: { signers: [{account, share, signed}] }. */
function signersFromJson(json: any): Signers {
    return new Signers(
        (json.signers as any[]).map(s => new Signer(s.account, s.share, s.signed))
    )
}

/** Reconstruct DAOPolicy from the fields spread into a DAO fact's toHintedObject(). */
function daoPolicyFromJson(json: any): DAOPolicy {
    const whitelist = new Whitelist(
        json.proposer_whitelist.active,
        (json.proposer_whitelist.accounts as string[]) ?? [],
    )
    return new DAOPolicy(
        json.voting_power_token,
        json.threshold,
        new Fee(json.proposal_fee.currency, json.proposal_fee.amount),
        whitelist,
        json.proposal_review_period,
        json.registration_period,
        json.pre_snapshot_period,
        json.voting_period,
        json.post_snapshot_period,
        json.execution_delay_period,
        json.turnout,
        json.quorum,
    )
}

/** Reconstruct a DAO Proposal (CryptoProposal or BizProposal) from its JSON. */
function proposalFromJson(json: any): CryptoProposal | BizProposal {
    const hint: string = json._hint
    if (hint.includes(HINT.DAO.PROPOSAL.CRYPTO)) {
        const cd = json.call_data
        const cdHint: string = cd._hint
        let calldata: TransferCalldata | GovernanceCalldata
        if (cdHint.includes(HINT.DAO.CALLDATA.TRANSFER)) {
            calldata = new TransferCalldata(
                cd.sender,
                cd.receiver,
                new Amount(cd.amount.currency, cd.amount.amount),
            )
        } else {
            calldata = new GovernanceCalldata(daoPolicyFromJson(cd.policy))
        }
        return new CryptoProposal(json.proposer, json.start_time, calldata)
    }
    // BizProposal
    return new BizProposal(json.proposer, json.start_time, json.url, json.hash, json.options)
}

/**
 * Reconstructs a Fact instance from its JSON representation (the output of
 * BaseOperation.toHintedObject().fact). This lets you call fact.toBytes() when
 * only the serialised JSON is available — e.g. for FIXED_DETAILED fee estimation.
 *
 * Supported domains: Currency, Token, Storage, Credential, DAO, NFT, Payment,
 * Point, Timestamp. (KYC and STO are excluded.)
 *
 * To add a new type, follow the same pattern below.
 *
 * @throws {Error} when the hint is not recognised
 */
export function factFromJson(factJson: any): Fact {
    const hint: string = factJson._hint
    const token = decodeBase64Token(factJson.token)

    // ======== CURRENCY ========

    if (hint.includes(HINT.CURRENCY.MINT.FACT)) {
        return new CurrencyMintFact(
            token,
            factJson.receiver,
            new Amount(factJson.amount.currency, factJson.amount.amount),
        )
    }

    if (hint.includes(HINT.CURRENCY.TRANSFER.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new CurrencyTransferItem(item.receiver, amountsFromJson(item.amounts))
        )
        return new CurrencyTransferFact(token, factJson.sender, items, factJson.currency)
    }

    if (hint.includes(HINT.CURRENCY.WITHDRAW.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new CurrencyWithdrawItem(item.target, amountsFromJson(item.amounts))
        )
        return new CurrencyWithdrawFact(token, factJson.sender, items, factJson.currency)
    }

    // Check CREATE_CONTRACT_ACCOUNT before CREATE_ACCOUNT (more specific first)
    if (hint.includes(HINT.CURRENCY.CREATE_CONTRACT_ACCOUNT.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new CreateContractAccountItem(keysFromJson(item.keys), amountsFromJson(item.amounts))
        )
        return new CreateContractAccountFact(token, factJson.sender, items, factJson.currency)
    }

    if (hint.includes(HINT.CURRENCY.CREATE_ACCOUNT.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new CreateAccountItem(keysFromJson(item.keys), amountsFromJson(item.amounts))
        )
        return new CreateAccountFact(token, factJson.sender, items, factJson.currency)
    }

    if (hint.includes(HINT.CURRENCY.UPDATE_KEY.FACT)) {
        return new UpdateKeyFact(token, factJson.sender, keysFromJson(factJson.keys), factJson.currency)
    }

    if (hint.includes(HINT.CURRENCY.UPDATE_HANDLER.FACT)) {
        return new UpdateHandlerFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
            factJson.handlers,
        )
    }

    // ======== TOKEN ========

    if (hint.includes(HINT.TOKEN.REGISTER_MODEL.FACT)) {
        return new TokenRegisterModelFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
            factJson.symbol,
            factJson.name,
            factJson.decimal,
            factJson.initial_supply,
        )
    }

    if (hint.includes(HINT.TOKEN.MINT.FACT)) {
        return new TokenMintFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
            factJson.receiver,
            factJson.amount,
        )
    }

    if (hint.includes(HINT.TOKEN.BURN.FACT)) {
        return new TokenBurnFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
            factJson.amount,
        )
    }

    // Check TRANSFER_FROM before TRANSFER (more specific first)
    if (hint.includes(HINT.TOKEN.TRANSFER_FROM.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new TokenTransferFromItem(item.contract, item.receiver, item.target, item.amount, item.currency)
        )
        return new TokenTransferFromFact(token, factJson.sender, items)
    }

    if (hint.includes(HINT.TOKEN.TRANSFER.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new TokenTransferItem(item.contract, item.receiver, item.amount, item.currency)
        )
        return new TokenTransferFact(token, factJson.sender, items)
    }

    if (hint.includes(HINT.TOKEN.APPROVE.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new TokenApproveItem(item.contract, item.approved, item.amount, item.currency)
        )
        return new TokenApproveFact(token, factJson.sender, items)
    }

    // ======== STORAGE ========

    if (hint.includes(HINT.STORAGE.REGISTER_MODEL.FACT)) {
        return new StorageRegisterModelFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.project,
            factJson.currency,
        )
    }

    if (hint.includes(HINT.STORAGE.CREATE_DATA.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new CreateDataItem(item.contract, item.currency, item.dataKey, item.dataValue)
        )
        return new CreateDataFact(token, factJson.sender, items)
    }

    if (hint.includes(HINT.STORAGE.UPDATE_DATA.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new UpdateDataItem(item.contract, item.currency, item.dataKey, item.dataValue)
        )
        return new UpdateDataFact(token, factJson.sender, items)
    }

    if (hint.includes(HINT.STORAGE.DELETE_DATA.FACT)) {
        return new DeleteDataFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.dataKey,
            factJson.currency,
        )
    }

    // ======== CREDENTIAL ========

    if (hint.includes(HINT.CREDENTIAL.REGISTER_MODEL.FACT)) {
        return new CredentialRegisterModelFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
        )
    }

    if (hint.includes(HINT.CREDENTIAL.ADD_TEMPLATE.FACT)) {
        return new AddTemplateFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.template_id,
            factJson.template_name,
            factJson.service_date,
            factJson.expiration_date,
            factJson.template_share,
            factJson.multi_audit,
            factJson.display_name,
            factJson.subject_key,
            factJson.description,
            factJson.creator,
            factJson.currency,
        )
    }

    if (hint.includes(HINT.CREDENTIAL.ISSUE.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new CredentialIssueItem(
                item.contract,
                item.holder,
                item.template_id,
                item.credential_id,
                item.value,
                item.valid_from,
                item.valid_until,
                item.did,
                item.currency,
            )
        )
        return new CredentialIssueFact(token, factJson.sender, items)
    }

    if (hint.includes(HINT.CREDENTIAL.REVOKE.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new RevokeItem(
                item.contract,
                item.holder,
                item.template_id,
                item.credential_id,
                item.currency,
            )
        )
        return new RevokeFact(token, factJson.sender, items)
    }

    // ======== DAO ========
    // RegisterModel and UpdateModelConfig spread policy fields into the fact JSON directly.

    if (hint.includes(HINT.DAO.REGISTER_MODEL.FACT)) {
        return new DAORegisterModelFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.option,
            daoPolicyFromJson(factJson),
            factJson.currency,
        )
    }

    if (hint.includes(HINT.DAO.UPDATE_MODEL_CONFIG.FACT)) {
        return new DAOUpdateModelConfigFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.option,
            daoPolicyFromJson(factJson),
            factJson.currency,
        )
    }

    if (hint.includes(HINT.DAO.PROPOSE.FACT)) {
        return new ProposeFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.proposal_id,
            proposalFromJson(factJson.proposal),
            factJson.currency,
        )
    }

    if (hint.includes(HINT.DAO.CANCEL_PROPOSAL.FACT)) {
        return new CancelProposalFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.proposal_id,
            factJson.currency,
        )
    }

    if (hint.includes(HINT.DAO.REGISTER.FACT)) {
        return new DAORegisterFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.proposal_id,
            factJson.approved,
            factJson.currency,
        )
    }

    if (hint.includes(HINT.DAO.PRE_SNAP.FACT)) {
        return new PreSnapFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.proposal_id,
            factJson.currency,
        )
    }

    if (hint.includes(HINT.DAO.POST_SNAP.FACT)) {
        return new PostSnapFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.proposal_id,
            factJson.currency,
        )
    }

    if (hint.includes(HINT.DAO.VOTE.FACT)) {
        return new VoteFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.proposal_id,
            factJson.vote_option,
            factJson.currency,
        )
    }

    if (hint.includes(HINT.DAO.EXECUTE.FACT)) {
        return new ExecuteFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.proposal_id,
            factJson.currency,
        )
    }

    // ======== NFT ========

    if (hint.includes(HINT.NFT.REGISTER_MODEL.FACT)) {
        return new NFTRegisterModelFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.name,
            factJson.royalty,
            factJson.uri,
            factJson.minter_whitelist ?? [],
            factJson.currency,
        )
    }

    if (hint.includes(HINT.NFT.UPDATE_MODEL_CONFIG.FACT)) {
        return new NFTUpdateModelConfigFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.name,
            factJson.royalty,
            factJson.uri,
            factJson.minter_whitelist ?? [],
            factJson.currency,
        )
    }

    if (hint.includes(HINT.NFT.MINT.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new NFTMintItem(
                item.contract,
                item.receiver,
                item.hash,
                item.uri,
                signersFromJson(item.creators),
                item.currency,
            )
        )
        return new NFTMintFact(token, factJson.sender, items)
    }

    if (hint.includes(HINT.NFT.APPROVE_ALL.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new ApproveAllItem(item.contract, item.approved, item.mode, item.currency)
        )
        return new ApproveAllFact(token, factJson.sender, items)
    }

    if (hint.includes(HINT.NFT.APPROVE.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new NFTApproveItem(item.contract, item.approved, item.nft_idx, item.currency)
        )
        return new NFTApproveFact(token, factJson.sender, items)
    }

    if (hint.includes(HINT.NFT.TRANSFER.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new NFTTransferItem(item.contract, item.receiver, item.nft_idx, item.currency)
        )
        return new NFTTransferFact(token, factJson.sender, items)
    }

    if (hint.includes(HINT.NFT.ADD_SIGNATURE.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new AddSignatureItem(item.contract, item.nft_idx, item.currency)
        )
        return new AddSignatureFact(token, factJson.sender, items)
    }

    // ======== PAYMENT ========

    if (hint.includes(HINT.PAYMENT.REGISTER_MODEL.FACT)) {
        return new PaymentRegisterModelFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
        )
    }

    if (hint.includes(HINT.PAYMENT.DEPOSIT.FACT)) {
        return new DepositFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
            factJson.amount,
            factJson.transfer_limit,
            factJson.start_time,
            factJson.end_time,
            factJson.duration,
        )
    }

    if (hint.includes(HINT.PAYMENT.TRANSFER.FACT)) {
        return new PaymentTransferFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
            factJson.receiver,
            factJson.amount,
        )
    }

    if (hint.includes(HINT.PAYMENT.WITHDRAW.FACT)) {
        return new PaymentWithdrawFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
        )
    }

    if (hint.includes(HINT.PAYMENT.UPDATE_ACCOUNT_SETTING.FACT)) {
        return new PaymentUpdateFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
            factJson.transfer_limit,
            factJson.start_time,
            factJson.end_time,
            factJson.duration,
        )
    }

    // ======== POINT ========

    if (hint.includes(HINT.POINT.REGISTER_MODEL.FACT)) {
        return new PointRegisterModelFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
            factJson.symbol,
            factJson.name,
            factJson.decimal,
            factJson.initial_supply,
        )
    }

    if (hint.includes(HINT.POINT.MINT.FACT)) {
        return new PointMintFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
            factJson.receiver,
            factJson.amount,
        )
    }

    if (hint.includes(HINT.POINT.BURN.FACT)) {
        return new PointBurnFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
            factJson.amount,
        )
    }

    // Check TRANSFER_FROM before TRANSFER (more specific first)
    if (hint.includes(HINT.POINT.TRANSFER_FROM.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new PointTransferFromItem(item.contract, item.receiver, item.target, item.amount, item.currency)
        )
        return new PointTransferFromFact(token, factJson.sender, items)
    }

    if (hint.includes(HINT.POINT.TRANSFER.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new PointTransferItem(item.contract, item.receiver, item.amount, item.currency)
        )
        return new PointTransferFact(token, factJson.sender, items)
    }

    if (hint.includes(HINT.POINT.APPROVE.FACT)) {
        const items = (factJson.items as any[]).map(item =>
            new PointApproveItem(item.contract, item.approved, item.amount, item.currency)
        )
        return new PointApproveFact(token, factJson.sender, items)
    }

    // ======== TIMESTAMP ========

    if (hint.includes(HINT.TIMESTAMP.REGISTER_MODEL.FACT)) {
        return new TimestampRegisterModelFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.currency,
        )
    }

    if (hint.includes(HINT.TIMESTAMP.ISSUE.FACT)) {
        return new TimestampIssueFact(
            token,
            factJson.sender,
            factJson.contract,
            factJson.project_id,
            factJson.request_timestamp,
            factJson.data,
            factJson.currency,
        )
    }

    throw new Error(
        `factFromJson: unsupported fact type "${hint}". ` +
        `Add support for this type in src/utils/factFromJson.ts.`
    )
}
