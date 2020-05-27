import { ChainTree, EcdsaKey } from "tupelo-lite"
import { getAppCommunity } from "./community"
import debug from 'debug';

const log = debug("store.namedTree")

export const findOrCreateTree = async (name: Uint8Array, ns: Uint8Array): Promise<ChainTree> => {
    const c = await getAppCommunity()
    const nameString = Buffer.from(name).toString()
    log("findOrCreateTree: ",nameString)

    const key = await EcdsaKey.passPhraseKey(name, ns)
    const did = key.toDid()
    log("findOrCreateTree: ",nameString, " did: ", did)

    try {
        log("findOrCreateTree getLatest ", nameString, " did: ", did)
        const tree = await c.getLatest(did)
        tree.key = key
        return tree
    } catch (err) {
        if (err.message.includes("not found")) {
            log("findOrCreateTree not found ", nameString, " did: ", did)
            return ChainTree.newEmptyTree(c.blockservice, key)
        }
        log(err)
        throw err
    }
}

export const updateTree = async (treePromise: Promise<ChainTree>): Promise<ChainTree> => {
    let treeP = treePromise
    const c = await getAppCommunity()

    let newP = new Promise<ChainTree>(async (resolve, reject) => {
        let tree = await treeP
        const did = await tree.id()
        log(`updating tree: `, did)
        const key = tree.key
        try {
            const latestTree = await c.getLatest(did!)
            tree = latestTree // doesn't get here on error
            tree.key = key
            log(`tree ${did} updated to ${tree.tip.toBaseEncodedString()}`)
        } catch (err) {
            // if we go to get latest and it's not found, we'll
            // just assume we're still at a blank tree (which is fine)
            // and just fall back to the original
            if (!err.message.includes("not found")) {
                console.error("updateTree err: ", err)
                reject(err)
                return
            }
        }
        resolve(tree)
    })

    return newP
}
