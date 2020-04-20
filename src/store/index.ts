import schema from './schema'
import {
    ApolloClient,
    InMemoryCache,
    Resolvers,
    gql,
    Cache,
} from '@apollo/client';
import {
    User,
    MutationRegisterArgs,
    TrackableCollection,
    Trackable,
    TrackableEdge,
    TrackableConnection,
    MutationCreateTrackableArgs,
    CreateTrackablePayload,
} from '../generated/graphql'
import { Tupelo, Community, Repo, ChainTree, EcdsaKey, setDataTransaction, setOwnershipTransaction } from 'tupelo-wasm-sdk'
import { AppUser } from 'ambient-react';
import { makeExecutableSchema } from 'graphql-tools';
import { SchemaLink } from '@apollo/link-schema';
import { getAppCommunity } from 'ambient-stack';
import { appUser } from 'ambient-react';
import { CURRENT_USER } from './queries';


interface TrackerContext {
    communityPromise: Promise<Community>,
    cache: Cache,
}

function namespaceToPath(namespace: string) {
    return `/apps/${namespace}/collection`
}

const resolvers: Resolvers = {
    User: {
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
        name: async (trackable: TrackableEdge, _context): Promise<string> => {
            const did = trackable.did.split("/")[1]
            const tree = await Tupelo.getLatest(did)
            return (await tree.resolveData("name")).value
        },
        image: async (trackable: Trackable, _context): Promise<string> => {
            const did = trackable.did.split("/")[1]
            const tree = await Tupelo.getLatest(did)
            return (await tree.resolveData("image")).value
        },
    },
    TrackableCollection: {
        trackables: async (collection: TrackableCollection, _context): Promise<TrackableConnection> => {
            const tree = await Tupelo.getLatest(collection.did)
            // this will be a map of timestamp to did
            const trackableResp = (await tree.resolveData("updates"))
            console.log(trackableResp)
            const trackables = trackableResp.value
            if (!trackables) {
                return { edges: [] }
            }
            return {
                edges: Object.keys(trackables).map((timestamp: string) => {
                    const did: string = trackables[timestamp]
                    return { did, node: { did } }
                })
            }
        }
    },
    TrackableEdge: {
        node: async (edge: TrackableEdge, _context): Promise<Trackable> => {
            const tree = await Tupelo.getLatest(edge.did)
            const trackable = (await tree.resolveData("/")).value
            return {
                ...trackable,
                did: "edge/" + edge.did,
            }
        }
    },
    Query: {
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

            await Promise.all([
                c.playTransactions(tree, [
                    setDataTransaction("/", input),
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
                }
            }
        },
        login: async (_root, { username, password }: MutationRegisterArgs, { cache }): Promise<User | undefined> => {
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
        register: async (_root, { username, password }: MutationRegisterArgs, { communityPromise }: TrackerContext): Promise<User | undefined> => {
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
