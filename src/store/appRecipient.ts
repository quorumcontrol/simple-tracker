import { getAppCommunity } from './community';
import { createNamedTree } from './identity';
import { setDataTransaction } from 'tupelo-wasm-sdk'
import debug from 'debug';

const log = debug("store.recipient")

export function recipientNamespace(appPrefix: string) {
    return `${appPrefix}/recipient`
}

export function recipientNamePath(appPrefix: string) {
    const ns = recipientNamespace(appPrefix)
    return `${ns}/name`
}

export function recipientAddressPath(appPrefix: string) {
    const ns = recipientNamespace(appPrefix)
    return `${ns}/address`
}

export function recipientInstructionsPath(appPrefix: string) {
    const ns = recipientNamespace(appPrefix)
    return `${ns}/instructions`
}

export async function createRecipientTree(appPrefix: string, name: string, password: string, address: string, instructions: string) {
    const c = await getAppCommunity()
    const ns = recipientNamespace(appPrefix)

    log("creating recipient chaintree")
    let recipientTree = await createNamedTree(name, password, Buffer.from(ns))

    log("setting recipient address and instructions")
    const addressTx = setDataTransaction(recipientAddressPath(appPrefix), address)
    const instructionsTx = setDataTransaction(recipientInstructionsPath(appPrefix), instructions)
    await c.playTransactions(recipientTree, [addressTx, instructionsTx])

    return recipientTree
}
