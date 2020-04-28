import { ChainTree, Tupelo, EcdsaKey, setDataTransaction, Community } from "tupelo-wasm-sdk"
import { User } from "./identity"
import { getAppCommunity } from "./community"
import debug from 'debug'

const log = debug("Drivers")

export class Drivers {
    private namespace: Buffer
    private region: Buffer
    treePromise: Promise<ChainTree>

    constructor({ region, namespace }: { region: string, namespace: string }) {
        this.region = Buffer.from(region)
        this.namespace = Buffer.from(namespace)
        this.treePromise = this.findOrCreateTree()
    }

    private async findOrCreateTree(): Promise<ChainTree> {
        const c = await getAppCommunity()

        const key = await EcdsaKey.passPhraseKey(this.region, this.namespace)
        const did = await key.toDid()
        try {
            const tree = await Tupelo.getLatest(did)
            tree.key = key
            return tree
        } catch (err) {
            log(err)
            if (err.message.includes("not found")) {
                return ChainTree.newEmptyTree(c.blockservice, key)
            }
            throw err
        }
    }

    updateTree() {
        let treeP = this.treePromise

        this.treePromise = new Promise<ChainTree>(async (resolve, reject) => {
                let tree = await treeP
                const key = tree.key
                try {
                    const latestTree = await Tupelo.getLatest((await tree.id())!)
                    tree = latestTree // doesn't get here on error
                    tree.key = key
                } catch(err) {
                    // if we go to get latest and it's not found, we'll
                    // just assume we're still at a blank tree (which is fine)
                    // and just fall back to the original 
                    if (!err.message.includes("not found")) {
                        reject(err)
                        return
                    }
                }
                resolve(tree)
        })
        return this.treePromise
    }

    async addDriver(driver: User) {
        let tree = await this.updateTree()
        const c = await getAppCommunity()
        let dids = (await tree.resolveData("drivers")).value
        if (!dids) {
            dids = []
        }
        dids.push(driver.did)
        return c.playTransactions(tree, [setDataTransaction('drivers', dids)])
    }
}