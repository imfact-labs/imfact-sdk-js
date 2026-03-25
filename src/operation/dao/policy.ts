import { Whitelist } from "./whitelist"

import { HINT } from "../../alias"
import { CurrencyID, Hint, Fee } from "../../common"
import { Big, HintedObject, IBytes, IHintedObject } from "../../types"
import { Assert, ECODE, MitumError } from "../../error"
import { Config } from "../../node"
import { concatBytes } from "../../utils/bytes"

export class DAOPolicy implements IBytes, IHintedObject {
    private hint: Hint
    readonly votingPowerToken: CurrencyID
    readonly threshold: Big
    readonly proposalFee: Fee
    readonly proposerWhitelist: Whitelist
    readonly proposalReviewPeriod: Big
    readonly registrationPeriod: Big
    readonly preSnapshotPeriod: Big
    readonly votingPeriod: Big
    readonly postSnapshotPeriod: Big
    readonly executionDelayPeriod: Big
    readonly turnout: Big
    readonly quorum: Big

    constructor(
        votingPowerToken: string | CurrencyID,
        threshold: string | number | Big,
        proposalFee: Fee,
        proposerWhitelist: Whitelist,
        proposalReviewPeriod: string | number | Big,
        registrationPeriod: string | number | Big,
        preSnapshotPeriod: string | number | Big,
        votingPeriod: string | number | Big,
        postSnapshotPeriod: string | number | Big,
        executionDelayPeriod: string | number | Big,
        turnout: string | number | Big,
        quorum: string | number | Big,
    ) {
        this.hint = new Hint(HINT.DAO.POLICY)
        this.votingPowerToken = CurrencyID.from(votingPowerToken)
        this.threshold = Big.from(threshold)
        this.proposalFee = proposalFee,
        this.proposerWhitelist = proposerWhitelist
        this.proposalReviewPeriod = Big.from(proposalReviewPeriod)
        this.registrationPeriod = Big.from(registrationPeriod)
        this.preSnapshotPeriod = Big.from(preSnapshotPeriod)
        this.votingPeriod = Big.from(votingPeriod)
        this.postSnapshotPeriod = Big.from(postSnapshotPeriod)
        this.executionDelayPeriod = Big.from(executionDelayPeriod)
        this.turnout = Big.from(turnout)
        this.quorum = Big.from(quorum)

        Assert.check(0 < this.proposalReviewPeriod.big && 0 < this.registrationPeriod.big && 0 < this.preSnapshotPeriod.big 
            && 0 < this.votingPeriod.big && 0 < this.postSnapshotPeriod.big && 0 < this.executionDelayPeriod.big, 
            MitumError.detail(ECODE.DAO.INVALID_POLICY, "period must not be set to 0 or below")
        )

        Assert.check(0 < this.threshold.big,
            MitumError.detail(ECODE.DAO.INVALID_POLICY, "threhold must be over zero"),
        )

        Assert.check(
            Config.DAO.QUORUM.satisfy(this.turnout.v),
            MitumError.detail(ECODE.DAO.INVALID_POLICY, "turnout out of range"),
        )

        Assert.check(
            Config.DAO.QUORUM.satisfy(this.quorum.v),
            MitumError.detail(ECODE.DAO.INVALID_POLICY, "quorum out of range"),
        )
    }

    toBytes(): Uint8Array {
        return concatBytes([
            this.votingPowerToken.toBytes(),
            this.threshold.toBytes(),
            this.proposalFee.toBytes(),
            this.proposerWhitelist.toBytes(),
            this.proposalReviewPeriod.toBytes("fill"),
            this.registrationPeriod.toBytes("fill"),
            this.preSnapshotPeriod.toBytes("fill"),
            this.votingPeriod.toBytes("fill"),
            this.postSnapshotPeriod.toBytes("fill"),
            this.executionDelayPeriod.toBytes("fill"),
            this.turnout.toBytes(),
            this.quorum.toBytes(),
        ])
    }

    toHintedObject(): HintedObject {
        return {
            _hint: this.hint.toString(),
            voting_power_token: this.votingPowerToken.toString(),
            threshold: this.threshold.toString(),
            proposal_fee: this.proposalFee.toHintedObject(),
            proposer_whitelist: this.proposerWhitelist.toHintedObject(),
            proposal_review_period: this.proposalReviewPeriod.v,
            registration_period: this.registrationPeriod.v,
            pre_snapshot_period: this.preSnapshotPeriod.v,
            voting_period: this.votingPeriod.v,
            post_snapshot_period: this.postSnapshotPeriod.v,
            execution_delay_period: this.executionDelayPeriod.v,
            turnout: this.turnout.v,
            quorum: this.quorum.v,
        }
    }
}