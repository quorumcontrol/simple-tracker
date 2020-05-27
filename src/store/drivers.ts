import { ChainTree, EcdsaKey, setDataTransaction } from "tupelo-lite"
import { User } from "./identity"
import { getAppCommunity } from "./community"
import { findOrCreateTree, updateTree } from "./openTree"
import debug from 'debug'
import { SimpleSyncer } from "./syncer"

const log = debug("store.drivers")

export class Drivers {
    private namespace: Buffer
    private region: Buffer
    private driversPath: string
    private _key: Promise<EcdsaKey>
    treePromise: Promise<ChainTree>
    queue:SimpleSyncer

    constructor({ region, namespace }: { region: string, namespace: string }) {
        this.region = Buffer.from(region)
        this.namespace = Buffer.from(namespace)
        this._key = EcdsaKey.passPhraseKey(this.region, this.namespace)
        this.queue = new SimpleSyncer("drivers")
        this.treePromise = this.queue.send(()=>{return findOrCreateTree(this.region, this.namespace)}) as Promise<ChainTree>
        this.driversPath = "drivers"
    }

    async graftableOwnership() {
        const did = await this.did()
        return [
            did,
            `${did}/tree/data/${this.driversPath}`,
        ]
    }

    async did() {
        return (await this.key()).toDid()
    }

    key() {
        return this._key
    }

    updateTree() {
        this.treePromise = updateTree(this.treePromise)
        return this.treePromise
    }

    async addDriver(driver: User) {
        const c = await getAppCommunity()
        return this.queue.send((async ()=> {
            let tree = await this.updateTree()
            log("resolving driversPath")
            let dids = (await tree.resolveData(this.driversPath)).value
            if (!dids) {
                dids = []
            }
            dids.push(driver.did)
            log("playing driver transaction: ", dids, " tree: ", tree)
            try {
                await c.playTransactions(tree, [setDataTransaction(this.driversPath, dids)])
            } catch(err) {
                log("error playing transaction: ", err)
                throw err
            }
            log("driver transaction worked")
            return
        }).bind(this))
    }
}
