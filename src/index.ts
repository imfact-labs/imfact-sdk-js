import { Generator} from "./types"
import type { IP} from "./types"
import { ECODE, DCODE, PCODE } from "./error"
import { Block, Node, NetworkID } from "./node"
import { Utils } from "./utils/transformUnit"
import { 
    Account, Currency, Contract, 
    NFT, DAO,
    // KYC, STO,
    TimeStamp, Credential,
    Token, Point, Storage, Payment,
    Signer
} from "./operation"
import { Operation } from "./operation/api"
import { BrowserProvider } from "./providers"

export class Mitum extends Generator {
    private _node: Node

    private _account: Account
    private _currency: Currency
    private _contract: Contract
    private _block: Block
    private _operation: Operation
    private _signer: Signer

    private _nft: NFT
    private _credential: Credential
    private _timestamp: TimeStamp
    // private _sto: STO
    // private _kyc: KYC
    private _dao: DAO
    private _token: Token
    private _point: Point
    private _storage: Storage
    private _payment: Payment

    public ECODE: Object
    public PCODE: Object
    public DCODE: Object

    private _utils: Utils

    public constructor(api?: string, delegateIP?: string) {
        super(NetworkID.get(), api, delegateIP)
        this._node = new Node(this.api, this.delegateIP)

        this._account = new Account(this.networkID,this.api, this.delegateIP)
        this._currency = new Currency(this.networkID, this.api, this.delegateIP)
        this._block = new Block(this.api, this.delegateIP)
        this._operation = new Operation(this.networkID, this.api, this.delegateIP)
        this._signer = new Signer(this.networkID, this.api)

        this._contract = new Contract(this.networkID, this.api, this.delegateIP)
        this._nft = new NFT(this.networkID, this.api, this.delegateIP)
        this._credential = new Credential(this.networkID, this.api, this.delegateIP)
        this._timestamp = new TimeStamp(this.networkID, this.api, this.delegateIP)
        // this._sto = new STO(this.networkID, this.api, this.delegateIP)
        // this._kyc = new KYC(this.networkID, this.api, this.delegateIP)
        this._dao = new DAO(this.networkID, this.api, this.delegateIP)
        this._token = new Token(this.networkID, this.api, this.delegateIP)
        this._point = new Point(this.networkID, this.api, this.delegateIP)
        this._storage = new Storage(this.networkID, this.api, this.delegateIP)
        this._payment = new Payment(this.networkID, this.api, this.delegateIP)

        this.ECODE = ECODE;
        this.PCODE = PCODE;
        this.DCODE = DCODE;

        this._utils = new Utils();
    }

    private refresh() {
        this._node = new Node(this.api, this.delegateIP)

        this._account = new Account(this.networkID, this.api, this.delegateIP)
        this._currency = new Currency(this.networkID, this.api, this.delegateIP)
        this._block = new Block(this.api, this.delegateIP)
        this._operation = new Operation(this.networkID, this.api, this.delegateIP)

        this._contract = new Contract(this.networkID, this.api, this.delegateIP)
        this._nft = new NFT(this.networkID, this.api, this.delegateIP)
        this._credential = new Credential(this.networkID, this.api, this.delegateIP)
        this._timestamp = new TimeStamp(this.networkID, this.api, this.delegateIP)
        // this._sto = new STO(this.networkID, this.api, this.delegateIP)
        // this._kyc = new KYC(this.networkID, this.api, this.delegateIP)
        this._dao = new DAO(this.networkID, this.api, this.delegateIP)
        this._token = new Token(this.networkID, this.api, this.delegateIP)
        this._point = new Point(this.networkID, this.api, this.delegateIP)
        this._storage = new Storage(this.networkID, this.api, this.delegateIP)
        this._payment = new Payment(this.networkID, this.api, this.delegateIP)

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

    get nft(): NFT {
        return this._nft
    }

    get credential(): Credential {
        return this._credential
    }

    get timestamp(): TimeStamp {
        return this._timestamp
    }

    // get sto(): STO {
    //     return this._sto
    // }

    // get kyc(): KYC {
    //     return this._kyc
    // }

    get dao(): DAO {
        return this._dao
    }

    get token(): Token {
        return this._token
    }

    get point(): Point {
        return this._point
    }

    get storage(): Storage {
        return this._storage
    }

    get payment(): Payment {
        return this._payment
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

export { BrowserProvider }
export type { Item, Fact, BaseOperation, Authentication, ProxyPayer, Settlement  } from "./operation/base";
export type { Account, HDAccount, defaultPath } from "./key/types";
export { isOpFact, isHintedObject, isHintedObjectFromUserOp } from "./utils/typeGuard"