import { Community, ChainTree, EcdsaKey, setDataTransaction } from "tupelo-lite"
import { getAppCommunity } from './community';
import { createNamedTree } from './identity';
import { findOrCreateTree, updateTree } from "./openTree"
import { Address, Recipient } from '../generated/graphql'
import debug from 'debug';

const log = debug("store.recipient")

export const recipientNamespace = 'givingchain/recipient-v2'
export const recipientNamePath = `${recipientNamespace}/name`
export const recipientAddressPath = `${recipientNamespace}/address`
export const recipientInstructionsPath = `${recipientNamespace}/instructions`
export const recipientListPath = `${recipientNamespace}/collection`
export const firstRecipientPath = `${recipientListPath}/0`

export async function createRecipientTree(name: string, password: string, address: Address, instructions: string) {
    const c = await getAppCommunity()

    log("creating recipient chaintree")
    let recipientTree = await createNamedTree(name, password, Buffer.from(recipientNamespace))

    log("setting recipient address and instructions")
    const nameTx = setDataTransaction(recipientNamePath, name)
    const addressTx = setDataTransaction(recipientAddressPath, address)
    const instructionsTx = setDataTransaction(recipientInstructionsPath, instructions)
    await c.playTransactions(recipientTree, [nameTx, addressTx, instructionsTx])

    return recipientTree
}

export class RecipientCollection {
    private region: Buffer
    private _key: Promise<EcdsaKey>
    treePromise: Promise<ChainTree>

    constructor(region: string) {
        this.region = Buffer.from(region + "-recipients")
        this._key = EcdsaKey.passPhraseKey(this.region, Buffer.from(recipientNamespace))
        this.treePromise = findOrCreateTree(this.region, Buffer.from(recipientNamespace))
    }

    updateTree() {
        this.treePromise = updateTree(this.treePromise)
        return this.treePromise
    }

    async did() {
        const tree = await this.treePromise
        return await tree.id()
    }

    key() {
        return this._key
    }

    async add(recipient: Recipient) {
        const c = await getAppCommunity()

        let tree = await this.updateTree()
        let dids = (await tree.resolveData(recipientListPath)).value
        if (!dids) {
            dids = []
        }
        dids.push(recipient.did)
        return c.playTransactions(tree, [setDataTransaction(recipientListPath, dids)])
    }

    async getAll() {
        log("getAll")
        let tree = await this.updateTree()
        log("afterTree")
        let dids = (await tree.resolveData(recipientListPath)).value
        if (!dids) {
            dids = []
        }

        return dids
    }

    async getFirst() {
        let tree = await this.updateTree()
        return (await tree.resolveData(firstRecipientPath)).value
    }
}
