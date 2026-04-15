import { IP } from "./string"
import { MitumError, ECODE } from "../error"

export abstract class Generator {
    protected _networkID: string
    protected _api: IP | undefined
    protected _delegateIP: IP | undefined

    protected constructor(networkID: string, api?: string | IP, delegateIP?: string | IP,) {
        this._networkID = networkID
        this.setAPI(api);
        this.setDelegate(delegateIP);
    }

    protected setNetworkID(networkID: string) {
        this._networkID = networkID
    }

    protected setAPI(api?: string | IP) {
        if (typeof api === "string") {
            if (api === "") {
                this._api = undefined;
                return;
            }

            const cleanApi = api.endsWith('/') ? api.slice(0, -1) : api;

            try {
                new URL(cleanApi);
            } catch {
                throw MitumError.detail(
                    ECODE.INVALID_IP,
                    `Invalid API URL provided: ${cleanApi}`
                );
            }

            this._api = IP.from(cleanApi);
        } else if (api instanceof IP) {
            this._api = api;
        } else {
            this._api = undefined;
        }
    }

    protected setDelegate(delegateIP?: string | IP) {
        if (typeof delegateIP === "string") {
            if (delegateIP === "") {
                this._delegateIP = undefined;
                return;
            }

            const cleanDelegate = delegateIP.endsWith('/') ? delegateIP.slice(0, -1) : delegateIP;

            try {
                new URL(cleanDelegate);
            } catch {
                throw MitumError.detail(
                    ECODE.INVALID_IP,
                    `Invalid delegate URL provided: ${cleanDelegate}`
                );
            }

            this._delegateIP = IP.from(cleanDelegate);
        } else if (delegateIP instanceof IP) {
            this._delegateIP = delegateIP;
        } else {
            this._delegateIP = undefined;
        }
    }

    protected get networkID() {
        return this._networkID
    }

    protected get api() {
        return this._api ? this._api.toString() : undefined
    }

    protected get delegateIP() {
        return this._delegateIP ? this._delegateIP.toString() : undefined
    }
}