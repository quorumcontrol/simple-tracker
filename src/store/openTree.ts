import { ChainTree, Tupelo, EcdsaKey, setDataTransaction, Community } from "tupelo-wasm-sdk"
import { getAppCommunity } from "./community"
import debug from 'debug';

const log = debug("store.namedTree")

export const findOrCreateTree = async (name: Uint8Array, ns: Uint8Array): Promise<ChainTree> => {
    const c = await getAppCommunity()

    const key = await EcdsaKey.passPhraseKey(name, ns)
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

export const updateTree = async (treePromise: Promise<ChainTree>): Promise<ChainTree> => {
    let treeP = treePromise

    let newP = new Promise<ChainTree>(async (resolve, reject) => {
        let tree = await treeP
        const key = tree.key
        try {
            const latestTree = await Tupelo.getLatest((await tree.id())!)
            tree = latestTree // doesn't get here on error
            tree.key = key
        } catch (err) {
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

    return newP
}
