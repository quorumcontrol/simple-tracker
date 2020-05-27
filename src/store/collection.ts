import { ChainTree, setDataTransaction } from "tupelo-lite"
import { Trackable, User } from "../generated/graphql"
import { getAppCommunity } from "./community"
import { findOrCreateTree, updateTree } from "./openTree"
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
        this.treePromise = findOrCreateTree(this.name, this.namespace)
    }

    updateTree() {
        this.treePromise = updateTree(this.treePromise)
        return this.treePromise
    }

    async getTrackables(): Promise<Trackable[]> {
        log('getTrackables')
        const tree = await this.treePromise
        const dids = await tree.resolveData("trackables")
        if (!dids.value) {
            return []
        }

        log('mapping trackables')
        return Object.keys(dids.value).map((did: string) => {
            const trackable: Trackable = {
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
        log(`addTrackable ${trackable.did}`)
        // TODO: this needs to retry but for now we'll assume low throughput
        //  and just grab the latest
        let tree = await this.updateTree()
        log(`addTrackable updating tree @ `, tree.tip.toBaseEncodedString())
        const c = await getAppCommunity()
        await c.playTransactions(tree, [setDataTransaction(`trackables/${trackable.did}`, false)]) // false means "unowned"
        log(`addTrackable updated to `, tree.tip.toBaseEncodedString())
        return
    }

    async ownTrackable(trackable: Trackable, user: User) {
        // TODO: as in addTrackable, this needs to retry but for now we'll assume low throughput
        //  and just grab the latest
        let tree = await this.updateTree()

        const c = await getAppCommunity()
        // set the trackable DID to the DID of the driver picking it up
        await c.playTransactions(tree, [setDataTransaction(`trackables/${trackable.did}`, user.did)])
        log(`ownTrackable updated to `, tree.tip.toBaseEncodedString())
        return
    }
}
