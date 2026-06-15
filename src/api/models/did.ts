import axios from "axios"
import { Address } from "../../key"
import { delegateUri } from "../../utils"

const url = (
    api: string | undefined, 
    contract: string | Address,
) => `${api}/did-registry/${Address.from(contract).toString()}`

async function getModel(
    api: string | undefined, 
    contract: string | Address,
    delegateIP: string | undefined
) {
    const apiPath = `${url(api, contract)}`;
    return !delegateIP ? await axios.get(apiPath) : await axios.get(delegateUri(delegateIP) + encodeURIComponent(apiPath)) 
}

async function getByAccount(
    api: string | undefined, 
    contract: string | Address,
    account: string,
    delegateIP: string | undefined
) {
    const apiPath = `${url(api, contract)}/did/${account}`;
    return !delegateIP ? await axios.get(apiPath) : await axios.get(delegateUri(delegateIP) + encodeURIComponent(apiPath)) 
}

async function getByDID(
    api: string | undefined, 
    contract: string | Address,
    did: string,
    delegateIP: string | undefined,
) {
    const apiPath = `${url(api, contract)}/document?did=${did}`;
    return !delegateIP ? await axios.get(apiPath) : await axios.get(delegateUri(delegateIP) + encodeURIComponent(apiPath)) 
}

export default {
    getModel,
    getByAccount,
    getByDID
}