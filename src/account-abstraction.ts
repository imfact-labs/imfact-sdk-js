import { Mitum as MitumCore } from "./index"
import { AccountAbstraction } from "./operation/accountAbstraction"
import type { IP } from "./types"

/**
 * Account-abstraction flavored Mitum.
 *
 * Extends the core {@link MitumCore} with the `aa` accessor, which exposes the
 * {@link AccountAbstraction} generator for building and signing UserOperations.
 * Everything the core `Mitum` provides (currency, token, nft, did, ...) is
 * inherited unchanged, so this is a drop-in superset for AA workflows.
 *
 * Exposed under the `@imfact/sdk/account-abstraction` subpath so that wallets
 * importing only `@imfact/sdk` never pull the AA code into their bundle.
 */
export class Mitum extends MitumCore {
    private _aa: AccountAbstraction

    public constructor(api?: string, delegateIP?: string) {
        super(api, delegateIP)
        this._aa = new AccountAbstraction(this.networkID, this.api, this.delegateIP)
    }

    get aa(): AccountAbstraction {
        return this._aa
    }

    private refreshAA() {
        this._aa = new AccountAbstraction(this.networkID, this.api, this.delegateIP)
    }

    setAPI(api: string | IP) {
        super.setAPI(api)
        this.refreshAA()
    }

    setDelegate(delegateIP: string | IP) {
        super.setDelegate(delegateIP)
        this.refreshAA()
    }

    setNetworkID(networkID: string) {
        super.setNetworkID(networkID)
        this.refreshAA()
    }
}

export { Mitum as MitumAA }
export default Mitum

export { AccountAbstraction } from "./operation/accountAbstraction"
export { UserOperation, Authentication, ProxyPayer, Settlement } from "./operation/base"
