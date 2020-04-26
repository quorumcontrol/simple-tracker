import { ChainTree, Tupelo, EcdsaKey, setDataTransaction, Community } from "tupelo-wasm-sdk"
import { Trackable, User } from "../generated/graphql"
import { getAppCommunity } from "./community"
import debug from 'debug'

const log = debug("AppCollection")

/**
 * Implements the global collection used by the application.
 */

/**
 * AppCollection is a app-level chaintree owned by a known key (anyone can write)
 * This allows the trackables added by donators to add their donation to a list
 * of donations which the drivers can then pick.
 */
export class AppCollection {
    private name: Buffer
    private namespace: Buffer
    treePromise: Promise<ChainTree>


    constructor({ name, namespace }: { name: string, namespace: string }) {
        this.name = Buffer.from(name)
        this.namespace = Buffer.from(namespace)
        this.treePromise = this.findOrCreateTree()
    }

    private async findOrCreateTree(): Promise<ChainTree> {
        const c = await getAppCommunity()

        const key = await EcdsaKey.passPhraseKey(this.name, this.namespace)
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

    async getTrackables():Promise<Trackable[]> {
        const tree = await this.treePromise
        const dids = await tree.resolveData("trackables")
        return Object.keys(dids.value).map((did:string)=> {
            const trackable:Trackable = {
                did: did,
                updates: {},
            }
            const driver = dids.value[did]
            if (driver) {
                trackable.driver = {
                    did: driver,
                }
            }
            return trackable
        })
    }

    async addTrackable(trackable: Trackable) {
        // TODO: this needs to retry but for now we'll assume low throughput
        //  and just grab the latest
        let tree = await this.updateTree()
        
        const c = await getAppCommunity()
        return c.playTransactions(tree, [setDataTransaction(`trackables/${trackable.did}`, false)]) // false means "unowned"
    }

    async ownTrackable(trackable: Trackable, user: User) {
        // TODO: as in addTrackable, this needs to retry but for now we'll assume low throughput
        //  and just grab the latest
        let tree = await this.updateTree()
        
        const c = await getAppCommunity()
        // set the trackable DID to the DID of the driver picking it up
        return c.playTransactions(tree, [setDataTransaction(`trackables/${trackable.did}`, user.did)])
    }
}