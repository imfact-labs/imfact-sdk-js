import { Generator, IP } from "./types"
import { ECODE, DCODE, PCODE } from "./error"
import { Block, Node, NetworkID } from "./node"
import { Utils } from "./utils/transformUnit"
import { 
    Account, Currency, Contract,
    Operation,
    Signer,
    AuthDID,
    AccountAbstraction,
    credential, dao, nft, payment,
	point, storage, timestamp, token
} from "./operation"
import { currency, account, contract } from "./operation/currency/index"
import { authdid } from "./operation/authdid/index";

const AllowedOperation = {
    currency,
    account,
    contract,
    authdid,
    credential, dao, nft, payment,
	point, storage, timestamp, token
} as const;

export class Mitum extends Generator {
    static allowedOperation = AllowedOperation;
    static ECODE = ECODE;
    static PCODE = PCODE;
    static DCODE = DCODE;

    private _node: Node
    private _utils: Utils
    private _account: Account
    private _currency: Currency
    private _contract: Contract
    private _block: Block
    private _operation: Operation
    private _signer: Signer
    private _authdid: AuthDID
    private _accountAbstraction: AccountAbstraction

    public constructor(api?: string, delegateIP?: string) {
        super(NetworkID.get(), api, delegateIP)
        this._node = new Node(this.api, this.delegateIP)

        this._account = new Account(this.networkID,this.api, this.delegateIP)
        this._currency = new Currency(this.networkID, this.api, this.delegateIP)
        this._block = new Block(this.api, this.delegateIP)
        this._operation = new Operation(this.networkID, this.api, this.delegateIP)
        this._signer = new Signer(this.networkID, this.api)

        this._contract = new Contract(this.networkID, this.api, this.delegateIP)
        this._authdid = new AuthDID(this.networkID, this.api, this.delegateIP)
        this._accountAbstraction = new AccountAbstraction(this.networkID, this.api, this.delegateIP)

        this._utils = new Utils();
    }

    private refresh() {
        this._node = new Node(this.api, this.delegateIP)

        this._account = new Account(this.networkID, this.api, this.delegateIP)
        this._currency = new Currency(this.networkID, this.api, this.delegateIP)
        this._block = new Block(this.api, this.delegateIP)
        this._operation = new Operation(this.networkID, this.api, this.delegateIP)

        this._contract = new Contract(this.networkID, this.api, this.delegateIP)
        this._authdid = new AuthDID(this.networkID, this.api, this.delegateIP)
        this._accountAbstraction = new AccountAbstraction(this.networkID, this.api, this.delegateIP)

        this._utils = new Utils();
    }

    get node(): Node {
        return this._node
    }

    get account(): Account {
        return this._account
    }

    get currency(): Currency {
        return this._currency
    }

    get block(): Block {
        return this._block
    }

    get operation(): Operation {
        return this._operation
    }

    get signer(): Signer {
        return this._signer
    }

    get contract(): Contract {
        return this._contract
    }

    get authdid(): AuthDID {
        return this._authdid
    }

    get aa(): AccountAbstraction {
        return this._accountAbstraction
    }

    get utils(): Utils {
        return this._utils
    }

    /**
     * Set the API URL to interact with Mitum network.
     * @param {string | IP} [api] - The API URL to set
     */
    setAPI(api: string | IP) {
        super.setAPI(api)
        this.refresh()
    }

    /**
     * Set the delegate IP address.
     * @param {string | IP} [delegateIP] - The delegate IP address to set.
     */
    setDelegate(delegateIP: string | IP) {
        super.setDelegate(delegateIP)
        this.refresh()
    }

    /**
     * Set the blockchain network ID (chain). The default value is configured to 'mitum'.
     * @param {string} [networkID] - The network ID to set.
     */
    setNetworkID(networkID: string) {
        super.setNetworkID(networkID)
        this.refresh()
    }
    
    /**Get the API URL in use.
     * @returns {string | undefined} The API URL. 
    */
    getAPI(): string | undefined {
        return this.api ? this.api.toString() : undefined
    }

    /**
     * Get the delegate IP in use.
     * @returns {string} The delegate IP address.
     */
    getDelegate(): string | undefined {
        return this.delegateIP ? this.delegateIP.toString() : undefined
    }
    
    /**Get the network ID in use.
     * @returns {string} The network ID (chain).
    */
    getNetworkID(): string {
        return this.networkID
    }
}

export default Mitum