import { debug } from "debug";
import { ChainTree, EcdsaKey, setDataTransaction, setOwnershipTransaction, Community } from "tupelo-lite";
import { EventEmitter } from "events";
import { getAppCommunity } from './community';

const log = debug("identity")

// TODO: this needs a rewrite, it was brought in from ambient-stack
// but is way too much code for the new simpler graphql stuff

/**
 * The path within the user ChainTree where decentratweet stores the username
 */
export const usernamePath = "givingchain/username"

/**
 * Generates a public/private keypair from an *insecure* passphrase (username).
 * The generated ChainTree will have a known name derived from the username
 * argument. The very first thing you do with the ChainTree should be to
 * ChangeOwner
 * @param username - the username
 * @param appNamespace - a namespace to drop the users into (a user is globally unique to their username/appNamespace combination eg: tobowers/clownfahrt.de is different than tobowers/differentNamespace.whatever)
 */
const insecureUsernameKey = async (username: string, appNamespace: Uint8Array) => {
    return EcdsaKey.passPhraseKey(Buffer.from(username), appNamespace)
}

/**
 * Convert a username-password pair into a secure ecdsa key pair for owning
 * arbitrary chaintrees.
 */
const securePasswordKey = async (username: string, password: string) => {
    return EcdsaKey.passPhraseKey(Buffer.from(password), Buffer.from(username))
}

/**
 * When given a public-private key pair, returns the did of a chaintree created
 * by that pairing
 */
const didFromKey = async (key: EcdsaKey) => {
    return key.toDid()
}

/**
 * Looks up the user account chaintree for the given username, returning it if
 * it exists.
 */
export const findUserAccount = async (username: string, appNamespace: Uint8Array): Promise<ChainTree | undefined> => {
    const community = await getAppCommunity()

    const insecureKey = await insecureUsernameKey(username, appNamespace)
    const did = await didFromKey(insecureKey)

    let tip
    let tree: ChainTree | undefined = undefined

    try {
        tip = await community.getTip(did)
    } catch (e) {
        if (e.message.includes("not found")) {
            // do nothing, let tip be null
            return undefined
        }
    }

    if (tip !== undefined) {
        tree = new ChainTree({
            store: community.blockservice,
            tip: tip,
        })
    }

    return tree
};

/**
 * Verifies that the secure password key generated with the provided username
 * and password matches one of the owner keys for the provided chaintree.
 */
export const verifyAccount = async (username: string, password: string, appNamespace: Uint8Array): Promise<[boolean, User?]> => {
    let secureKey = await securePasswordKey(username, password)
    let secureAddr = secureKey.address()
    const community = await getAppCommunity()

    const tree = await findUserAccount(username, appNamespace)
    if (tree === undefined) {
        return [false, undefined]
    }

    let resolveResp = await tree.resolve("tree/_tupelo/authentications")
    let auths: string[] = resolveResp.value
    if (auths.includes(secureAddr)) {
        tree.key = secureKey
        const user = new User(username, tree, community)
        await user.load()
        return [true, user]
    } else {
        return [false, undefined]
    }
}

export const createNamedTree = async (name: string, password: string, appNamespace: Uint8Array) => {
    const c = await getAppCommunity()

    log(`creating key for ${name}`)
    const insecureKey = await insecureUsernameKey(name, appNamespace)
    const secureKey = await securePasswordKey(name, password)
    const secureKeyAddress = secureKey.address()
    const treeDid = insecureKey.toDid()

    try {
        let tip = await c.getTip(treeDid)
        if (tip) {
            throw new Error("account already exists")
        }
    } catch (e) {
        if (!(e.message.includes("not found"))) {
            throw e
        }
        // otherwise we didn't find the user so we can proceed
    }

    log("creating named chaintree", name, insecureKey.toDid())
    const namedTree = await ChainTree.newEmptyTree(c.blockservice, insecureKey)

    log("transferring ownership of user chaintree")
    await c.playTransactions(namedTree, [
        // Set the ownership of the user chaintree to our secure key (thus
        // owning the username)
        setOwnershipTransaction([secureKeyAddress]),

        // Cache the username inside of the chaintree for easier access later
        setDataTransaction(usernamePath, name),
    ])

    namedTree.key = secureKey

    return namedTree
}

/**
 * Registers a username-password pair by creating a new account chaintree
 * corresponding to the username, and transferring ownership to the secure key
 * pair corresponding to the username-password pair.
 *
 * Returns a handle for the created * chaintree
 */
export const register = async (username: string, password: string, appNamespace: Uint8Array) => {
    log("register ", username)
    const c = await getAppCommunity()

    let userTree = await createNamedTree(username, password, appNamespace)
    log("user tree for ", username, " created")
    return new User(username, userTree, c)
}

/**
 * Find the username from the given user account ChainTree
 */
export const resolveUsername = async (tree: ChainTree) => {
    log("fetching username")
    const usernameResp = await tree.resolveData(usernamePath)
    if (usernameResp.remainderPath.length && usernameResp.remainderPath.length > 0) {
        return ""
    } else {
        return usernameResp.value
    }
}

export class User extends EventEmitter {
    tree: ChainTree
    did?: string
    community: Community
    userName: string

    //TODO: error handling
    static async find(userName: string, appNamespace: Uint8Array, community: Community, ) {
        const tree = await findUserAccount(userName, appNamespace)
        if (!tree) {
            throw new Error("no tree found")
        }
        return new User(userName, tree, community)
    }

    constructor(userName: string, tree: ChainTree, community: Community) {
        super()
        this.tree = tree
        this.community = community
        this.userName = userName
    }

    async load() {
        await this.setDid()
        return this
    }

    private async setDid(): Promise<string> {
        const did = await this.tree.id()
        if (did === null) {
            throw new Error("invalid did")
        }
        this.did = did
        return did
    }
}
