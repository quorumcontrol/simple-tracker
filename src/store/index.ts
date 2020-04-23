import schema from './schema'
import {
    ApolloClient,
    InMemoryCache,
    Resolvers,
} from '@apollo/client';
import {
    User,
    MutationRegisterArgs,
    TrackableCollection,
    Trackable,
    MutationCreateTrackableArgs,
    CreateTrackablePayload,
    QueryGetTrackableArgs,
    TrackableUpdateConnection,
    AddUpdatePayload,
    MutationAddUpdateArgs,
    TrackableUpdate,
    TrackableCollaboratorConnection,
    MutationAddCollaboratorArgs,
    AddCollaboratorPayload,
} from '../generated/graphql'
import { Tupelo, Community, ChainTree, EcdsaKey, setDataTransaction, setOwnershipTransaction } from 'tupelo-wasm-sdk'
import { AppUser } from './user';
import { makeExecutableSchema } from 'graphql-tools';
import { SchemaLink } from '@apollo/link-schema';
import { getAppCommunity } from './community';
import { appUser } from './user';
import { CURRENT_USER } from './queries';
const GraphQLJSON = require('graphql-type-json');

export const userNamespace = 'local-only-tracker'
export const usernamePath = "tupelo.me/username" // taken from ambient stack - should probably be `userNamespace/username` 

AppUser.setUserNamespace(userNamespace)

interface TrackerContext {
    communityPromise: Promise<Community>,
    cache: Cache,
}

function namespaceToPath(namespace: string) {
    return `/apps/${namespace}/collection`
}

/**
 * Looks up the user account chaintree for the given username, returning it if
 * it exists.
 */
const findUserAccount = async (username: string, appNamespace:Uint8Array):Promise<ChainTree|undefined> => {
    const community = await getAppCommunity()

    const insecureKey = await EcdsaKey.passPhraseKey(Buffer.from(username), appNamespace)
    const did = await insecureKey.toDid()

    let tip
    let tree:ChainTree|undefined = undefined

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
 * Find the username from the given user account ChainTree
 */
const resolveUsername = async (tree: ChainTree) => {
    const usernameResp = await tree.resolveData(usernamePath)
    if (usernameResp.remainderPath.length && usernameResp.remainderPath.length > 0) {
        return ""
    } else {
        return usernameResp.value
    }
}

const resolvers: Resolvers = {
    JSON: GraphQLJSON,
    User: {
        username: async (user: User, { communityPromise }: TrackerContext): Promise<String> => {
            const tree = await Tupelo.getLatest(user.did)
            return resolveUsername(tree)
        },
        collection: async (user: User, { communityPromise }: TrackerContext): Promise<TrackableCollection | undefined> => {
            const tree = await Tupelo.getLatest(user.did)
            if (!user.namespace) {
                return undefined
            }
            const did = (await tree.resolveData(namespaceToPath(user.namespace))).value
            return {
                did: did!
            }
        }
    },
    Trackable: {
        collaborators: async (trackable: Trackable, _context): Promise<TrackableCollaboratorConnection> => {
            const did = trackable.did
            const tree = await Tupelo.getLatest(did)
            const resp = await tree.resolveData("collaborators")
            if (!resp.value) {
                return {edges: []}
            }
            const edges = Object.keys(resp.value).map((did:string)=> {
                return {did}
            })

            return {edges}
        },
        name: async (trackable: Trackable, _context): Promise<string> => {
            console.log("name trackable: ", trackable)
            const did = trackable.did
            const tree = await Tupelo.getLatest(did)
            return (await tree.resolveData("name")).value
        },
        image: async (trackable: Trackable, _context): Promise<string> => {
            const did = trackable.did
            const tree = await Tupelo.getLatest(did)
            return (await tree.resolveData("image")).value
        },
        updates: async (trackable: Trackable, _context): Promise<TrackableUpdateConnection> => {
            const did = trackable.did
            const tree = await Tupelo.getLatest(did)
            let updates = await tree.resolveData("updates")
            console.log("updates from resolve: ", updates.value)
            if (updates.value) {
                // updates is a map of timestamp to TrackableUpdate
                let edges = await Promise.all(Object.keys(updates.value).map(async (timestamp)=> {
                    let update = (await tree.resolveData(`updates/${timestamp}`)).value
                    console.log("resolved update: ", update)
                    update.did = `${did}-${timestamp}`
                    return update
                }))
                return {edges}
            }

            return {
                edges: [],
            }
        }
    },
    TrackableCollection: {
        trackables: async (collection: TrackableCollection, _context): Promise<Trackable[]> => {
            const tree = await Tupelo.getLatest(collection.did)
            // this will be a map of timestamp to did
            const trackableResp = (await tree.resolveData("updates"))
            console.log(trackableResp)
            const trackables = trackableResp.value
            if (!trackables) {
                return []
            }
            return Object.keys(trackables).map((timestamp: string) => {
                const did: string = trackables[timestamp]
                return { did, updates:{} }
            })
        }
    },

    Query: {
        getTrackable: async (_root, {did}:QueryGetTrackableArgs ,_ctx:TrackerContext) => {
            console.log("get trackable: ", did)
            const tree = await Tupelo.getLatest(did)
            return {
                did: await tree.id(),
            }
        },
        me: async (_, { communityPromise }: TrackerContext): Promise<User | undefined> => {
            if (!appUser.userPromise) {
                return undefined
            }
            let ambientUser = await appUser.userPromise
            if (!ambientUser) {
                return undefined
            }

            return {
                did: ambientUser.did!,
                namespace: AppUser.userNamespace?.toString()!,
                username: ambientUser.userName,
                loggedIn: true,
            }
        }
    },
    Mutation: {
        createTrackable: async (_root, { input }: MutationCreateTrackableArgs, { communityPromise, cache }: TrackerContext): Promise<CreateTrackablePayload | undefined> => {
            if (!appUser.userPromise) {
                return undefined
            }
            let ambientUser = await appUser.userPromise
            if (!ambientUser) {
                return undefined
            }

            let buf = Buffer.from(ambientUser.tree.key?.privateKey!).toString()

            let passphrase = buf + "/trackables/" + input?.name
            let trackableKey = await EcdsaKey.passPhraseKey(Buffer.from(passphrase), Buffer.from(AppUser.userNamespace?.toString()!))
            const c = await communityPromise
            let tree = await ChainTree.newEmptyTree(c.blockservice, trackableKey)
            const now = (new Date()).getTime()

            const namespace = AppUser.userNamespace?.toString()!

            console.log(await ambientUser.tree.resolveData(`/apps/${namespace}`))

            const collectionDid = (await ambientUser.tree.resolveData(namespaceToPath(namespace))).value
            console.log("getting: ", collectionDid)
            const collectionTree = await Tupelo.getLatest(collectionDid)
            collectionTree.key = ambientUser.tree.key
            let collaborators:{[key:string]:Boolean} = {}
            collaborators[(await ambientUser.tree.id())!] = true

            await Promise.all([
                c.playTransactions(tree, [
                    setDataTransaction("/", input),
                    setDataTransaction("collaborators", collaborators),
                    setOwnershipTransaction([await ambientUser.tree.key!.address()]),
                ]),
                c.playTransactions(collectionTree, [setDataTransaction(`updates/${now}`, await tree.id())])
            ])
            return {
                collection: {
                    did: (await collectionTree.id())!,
                },
                trackable: {
                    did: (await tree.id())!,
                    name: input.name,
                    updates: {},
                }
            }
        },
        login: async (_root, { username, password }: MutationRegisterArgs, { cache, communityPromise }): Promise<User | undefined> => {
            await communityPromise
            let [success, ambientUser] = await appUser.login(username!, password!)
            if (!success || !ambientUser) {
                return undefined
            }

            await ambientUser.load()
            let user = {
                did: ambientUser.did!,
                namespace: AppUser.userNamespace?.toString()!,
                username: ambientUser.userName,
                loggedIn: true,
            }

            cache.writeQuery({
                query: CURRENT_USER,
                data: { me: user }
            })

            return user
        },
        // TODO: this is way easier when chaintrees can own chaintrees
        addCollaborator: async (_root, { input: {trackable, username} }: MutationAddCollaboratorArgs, { communityPromise }: TrackerContext): Promise<AddCollaboratorPayload | undefined> => {
            if (!appUser.userPromise) {
                return undefined
            }
            let ambientUser = await appUser.userPromise
            if (!ambientUser) {
                return undefined
            }
            await ambientUser.load()

            const collaboratorTree = await findUserAccount(username, Buffer.from(AppUser.userNamespace?.toString()!))
            if (!collaboratorTree) {
                return {code: 404}
            }
            let collaboratorAuths = (await collaboratorTree.resolve("tree/_tupelo/authentications")).value

            // const namespace = AppUser.userNamespace?.toString()!

            const trackableTree = await Tupelo.getLatest(trackable)
            trackableTree.key = ambientUser.tree.key

            let trackableAuthsResp = await trackableTree.resolve("tree/_tupelo/authentications")
            let auths: string[] = trackableAuthsResp.value || []
            auths = auths.concat(collaboratorAuths)

            let c = await communityPromise
            await c.playTransactions(trackableTree, [
                setDataTransaction(`collaborators/${await collaboratorTree.id()}`, true),
                setOwnershipTransaction(auths)
            ])
            return {
                collaborator: {
                    did: (await collaboratorTree.id())!,
                },
                code: 200
            }

        },
        addUpdate: async (_root, { input: {trackable,message,metadata} }: MutationAddUpdateArgs, { communityPromise }: TrackerContext): Promise<AddUpdatePayload | undefined> => {
            if (!appUser.userPromise) {
                return undefined
            }
            let ambientUser = await appUser.userPromise
            if (!ambientUser) {
                return undefined
            }
            await ambientUser.load()

            // const namespace = AppUser.userNamespace?.toString()!

            let timestamp = (new Date()).toISOString()

            const trackableTree = await Tupelo.getLatest(trackable)
            trackableTree.key = ambientUser.tree.key

            let update:TrackableUpdate = {
                did: `${(await trackableTree.id())}-${timestamp}`,
                timestamp: timestamp,
                message: message,
                metadata: metadata,
                userDid: ambientUser.did!,
                userName: ambientUser.userName,
            }
            console.log("update: ", update)
            let c = await communityPromise
            await c.playTransactions(trackableTree, [setDataTransaction(`updates/${timestamp}`, update)])
            return {
                update: update,
            }

        },
        register: async (_root, { username, password }: MutationRegisterArgs, { communityPromise }: TrackerContext): Promise<User | undefined> => {
            await communityPromise

            let ambientUser = await appUser.register(username!, password!)
            if (!ambientUser) {
                return undefined
            }

            await ambientUser.load()
            const namespace = AppUser.userNamespace?.toString()!
            let user = {
                did: ambientUser.did!,
                namespace: namespace,
                username: ambientUser.userName,
                loggedIn: true,
            }
            let pathToTree = namespaceToPath(namespace)

            let buf = Buffer.from(ambientUser.tree.key?.privateKey!).toString()

            let passphrase = buf + pathToTree + "collection"

            let appKey = await EcdsaKey.passPhraseKey(Buffer.from(passphrase), Buffer.from(namespace))

            const c = await communityPromise
            let tree = await ChainTree.newEmptyTree(c.blockservice, appKey)

            console.log('setting data')
            await Promise.all([
                c.playTransactions(ambientUser.tree, [setDataTransaction(pathToTree, await (await tree).id())]),
                c.playTransactions(tree, [setOwnershipTransaction([await ambientUser.tree.key!.address()])])
            ])

            console.log("post register resolve: ", await ambientUser.tree.resolveData(`/apps/${namespace}`))


            cache.writeQuery({
                query: CURRENT_USER,
                data: { me: user }
            })

            return user
        },
        logout: async (_root, _variables, { cache }): Promise<User> => {
            console.log("writing query")

            const user = (await appUser.userPromise)
            await user?.load()


            await appUser.logout()

            return {
                did: user?.did!,
                loggedIn: false,
            }
        }
    }
}

const executableSchema = makeExecutableSchema<TrackerContext>({
    typeDefs: schema,
    resolvers: resolvers,
})

const cache = new InMemoryCache({
    dataIdFromObject: (object: any) => (object.did || null)
})

export const client = new ApolloClient({
    link: new SchemaLink({ schema: executableSchema, context: { cache: cache, communityPromise: getAppCommunity() } }),
    cache: cache,
    typeDefs: schema,
});

export default client
