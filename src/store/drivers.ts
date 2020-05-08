import { ChainTree, EcdsaKey, setDataTransaction } from "tupelo-wasm-sdk"
import { User } from "./identity"
import { getAppCommunity } from "./community"
import { findOrCreateTree, updateTree } from "./openTree"
import debug from 'debug'

const log = debug("Drivers")

export class Drivers {
    private namespace: Buffer
    private region: Buffer
    private driversPath: string
    private _key: Promise<EcdsaKey>
    treePromise: Promise<ChainTree>

    constructor({ region, namespace }: { region: string, namespace: string }) {
        this.region = Buffer.from(region)
        this.namespace = Buffer.from(namespace)
        this._key = EcdsaKey.passPhraseKey(this.region, this.namespace)
        this.treePromise = findOrCreateTree(this.region, this.namespace)
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
        let tree = await this.updateTree()
        const c = await getAppCommunity()
        let dids = (await tree.resolveData(this.driversPath)).value
        if (!dids) {
            dids = []
        }
        dids.push(driver.did)
        return c.playTransactions(tree, [setDataTransaction(this.driversPath, dids)])
    }
}
