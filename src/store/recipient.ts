import { getAppCommunity } from './community';
import { createNamedTree } from './identity';
import { setDataTransaction } from 'tupelo-wasm-sdk'
import debug from 'debug';

const log = debug("store.recipient")

export const recipientNamespace = 'givingchain/recipient'
export const recipientNamePath = `${recipientNamespace}/name`
export const recipientAddressPath = `${recipientNamespace}/address`
export const recipientInstructionsPath = `${recipientNamespace}/instructions`

export async function createRecipientTree(name: string, password: string, address: string, instructions: string) {
    const c = await getAppCommunity()

    log("creating recipient chaintree")
    let recipientTree = await createNamedTree(name, password, Buffer.from(recipientNamespace))

    log("setting recipient address and instructions")
    const addressTx = setDataTransaction(recipientAddressPath, address)
    const instructionsTx = setDataTransaction(recipientInstructionsPath, instructions)
    await c.playTransactions(recipientTree, [addressTx, instructionsTx])

    return recipientTree
}
