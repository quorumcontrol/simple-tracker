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
    QueryGetTrackablesArgs,
    AcceptJobPayload,
    MutationAcceptJobArgs,
} from '../generated/graphql'
import { Tupelo, Community, ChainTree, EcdsaKey, setDataTransaction, setOwnershipTransaction } from 'tupelo-wasm-sdk'
import { AppUser } from './user';
import { makeExecutableSchema } from 'graphql-tools';
import { SchemaLink } from '@apollo/link-schema';
import { getAppCommunity } from './community';
import { appUser } from './user';
import { CURRENT_USER } from './queries';
import { AppCollection } from './collection';
import debug from 'debug';
const GraphQLJSON = require('graphql-type-json');

export const userNamespace = 'givingchain'
export const usernamePath = "givingchain/username"

const log = debug("store.resolvers")

AppUser.setUserNamespace(userNamespace)

interface TrackerContext {
    communityPromise: Promise<Community>,
    cache: Cache,
}

function namespaceToPath(namespace: string) {
    return `/apps/${namespace}/collection`
}

const appCollection = new AppCollection({name: `${userNamespace}/trackables`, namespace: userNamespace})

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
            log("name trackable: ", trackable)
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
            log("updates from resolve: ", updates.value)
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
            log(trackableResp)
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
        getTrackables: async(_root, {filters}:QueryGetTrackablesArgs, _ctx:TrackerContext) => {
            let dids = await appCollection.getTrackables()
            return {
                did: await (await appCollection.treePromise).id()!,
                trackables: dids.map((did:string):Trackable => {
                    return {
                        did: did,
                        updates: {},
                    }
                })
            } as TrackableCollection
        },
        getTrackable: async (_root, {did}:QueryGetTrackableArgs ,_ctx:TrackerContext) => {
            log("get trackable: ", did)
            const tree = await Tupelo.getLatest(did)
            return {
                did: await tree.id(),
            }
        },
        me: async (_, { communityPromise }: TrackerContext): Promise<User | undefined> => {
            if (!appUser.userPromise) {
                return undefined
            }
            let user = await appUser.userPromise
            if (!user) {
                return undefined
            }

            return {
                did: user.did!,
                namespace: AppUser.userNamespace?.toString()!,
                username: user.userName,
                loggedIn: true,
            }
        }
    },
    Mutation: {
        createTrackable: async (_root, { input }: MutationCreateTrackableArgs, { communityPromise, cache }: TrackerContext): Promise<CreateTrackablePayload | undefined> => {
            log('createTrackable')
            if (!appUser.userPromise) {
                return undefined
            }
            let user = await appUser.userPromise
            if (!user) {
                return undefined
            }

            let buf = Buffer.from(user.tree.key?.privateKey!).toString()

            log("creating passphrase key")
            let passphrase = buf + "/trackables/" + input?.name
            let trackableKey = await EcdsaKey.passPhraseKey(Buffer.from(passphrase), Buffer.from(AppUser.userNamespace?.toString()!))
            log("creating trackable tree")
            const c = await communityPromise
            let tree = await ChainTree.newEmptyTree(c.blockservice, trackableKey)
            const now = (new Date()).getTime()

            const collectionDid = (await user.tree.resolveData(namespaceToPath(userNamespace))).value
            log("getting: ", collectionDid)
            const collectionTree = await Tupelo.getLatest(collectionDid)
            collectionTree.key = user.tree.key
            let collaborators:{[key:string]:Boolean} = {}
            collaborators[(await user.tree.id())!] = true

            await Promise.all([
                c.playTransactions(tree, [
                    setDataTransaction("/", input),
                    setDataTransaction("collaborators", collaborators),
                    setOwnershipTransaction([await user.tree.key!.address()]),
                ]),
                c.playTransactions(collectionTree, [setDataTransaction(`updates/${now}`, await tree.id())])
            ])
            const trackable = {
                did: (await tree.id())!,
                name: input.name,
                updates: {},
            }
            // TODO: this might make adding too slow, consider doing this in the background
            await appCollection.addTrackable(trackable)
            return {
                collection: {
                    did: (await collectionTree.id())!,
                },
                trackable: trackable
            }
        },
        login: async (_root, { username, password }: MutationRegisterArgs, { cache, communityPromise }): Promise<User | undefined> => {
            await communityPromise
            let [success, user] = await appUser.login(username!, password!)
            if (!success || !user) {
                return undefined
            }

            await user.load()
            let userObj = {
                did: user.did!,
                namespace: AppUser.userNamespace?.toString()!,
                username: user.userName,
                loggedIn: true,
            }

            cache.writeQuery({
                query: CURRENT_USER,
                data: { me: userObj }
            })

            return userObj
        },
        // TODO: this is way easier when chaintrees can own chaintrees
        addCollaborator: async (_root, { input: {trackable, username} }: MutationAddCollaboratorArgs, { communityPromise }: TrackerContext): Promise<AddCollaboratorPayload | undefined> => {
            if (!appUser.userPromise) {
                return undefined
            }
            let user = await appUser.userPromise
            if (!user) {
                return undefined
            }
            await user.load()

            const collaboratorTree = await findUserAccount(username, Buffer.from(AppUser.userNamespace?.toString()!))
            if (!collaboratorTree) {
                return {code: 404}
            }
            let collaboratorAuths = (await collaboratorTree.resolve("tree/_tupelo/authentications")).value

            const trackableTree = await Tupelo.getLatest(trackable)
            trackableTree.key = user.tree.key

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
            let user = await appUser.userPromise
            if (!user) {
                return undefined
            }
            await user.load()

            let timestamp = (new Date()).toISOString()

            const trackableTree = await Tupelo.getLatest(trackable)
            trackableTree.key = user.tree.key

            let update:TrackableUpdate = {
                did: `${(await trackableTree.id())}-${timestamp}`,
                timestamp: timestamp,
                message: message,
                metadata: metadata,
                userDid: user.did!,
                userName: user.userName,
            }
            log("update: ", update)
            let c = await communityPromise
            await c.playTransactions(trackableTree, [setDataTransaction(`updates/${timestamp}`, update)])
            return {
                update: update,
            }

        },
        register: async (_root, { username, password }: MutationRegisterArgs, { communityPromise }: TrackerContext): Promise<User | undefined> => {
            await communityPromise

            let user = await appUser.register(username!, password!)
            if (!user) {
                return undefined
            }

            await user.load()
            const namespace = AppUser.userNamespace?.toString()!
            let userObj = {
                did: user.did!,
                namespace: namespace,
                username: user.userName,
                loggedIn: true,
            }
            let pathToTree = namespaceToPath(namespace)

            let buf = Buffer.from(user.tree.key?.privateKey!).toString()

            let passphrase = buf + pathToTree + "collection"

            let appKey = await EcdsaKey.passPhraseKey(Buffer.from(passphrase), Buffer.from(namespace))

            const c = await communityPromise
            let tree = await ChainTree.newEmptyTree(c.blockservice, appKey)

            log('setting data')
            await Promise.all([
                c.playTransactions(user.tree, [setDataTransaction(pathToTree, await (await tree).id())]),
                c.playTransactions(tree, [setOwnershipTransaction([await user.tree.key!.address()])])
            ])

            log("post register resolve: ", await user.tree.resolveData(`/apps/${namespace}`))
            
            cache.writeQuery({
                query: CURRENT_USER,
                data: { me: userObj }
            })

            return userObj
        },
        logout: async (_root, _variables, { cache }): Promise<User> => {
            log("writing query")

            const user = (await appUser.userPromise)
            await user?.load()


            await appUser.logout()

            return {
                did: user?.did!,
                loggedIn: false,
            }
        },
        acceptJob: async (_root, {input: {user,trackable}}:MutationAcceptJobArgs, {cache,communityPromise}: TrackerContext): Promise<AcceptJobPayload|undefined> => {
            if (!appUser.userPromise) {
                return undefined
            }
            let loggedinUser = await appUser.userPromise
            if (!loggedinUser || (loggedinUser.did !== user)) {
                return undefined
            }
            await loggedinUser.load()
    
            // first we update the trackable
            // TODO: DRY This up from the addUpdate resolver

            let timestamp = (new Date()).toISOString()

            const trackableTree = await Tupelo.getLatest(trackable)
            trackableTree.key = loggedinUser.tree.key

            let update:TrackableUpdate = {
                did: `${(await trackableTree.id())}-${timestamp}`,
                timestamp: timestamp,
                message: "Accepted the delivery",
                userDid: loggedinUser.did!,
                userName: loggedinUser.userName,
            }
            log("update: ", update)
            let c = await communityPromise
            await c.playTransactions(trackableTree, [setDataTransaction(`updates/${timestamp}`, update)])
            
            // then mark it owned on the appCollection
            await appCollection.ownTrackable({did: trackable, updates: {}}, {did: user})
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
