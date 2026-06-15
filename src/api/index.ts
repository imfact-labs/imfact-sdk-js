import accountApi from "./account"
import blockApi from "./block"
import nodeApi from "./node"
import operationApi from "./operation"
import models from "./models"
import { getAPIData } from "./getAPIData"

const currencyApi = models.currency
const contractApi = models.contract

export {
  accountApi,
  blockApi,
  nodeApi,
  operationApi,
  currencyApi,
  contractApi,
  getAPIData,
}