import schema from './schema'
import {
    ApolloClient,
    InMemoryCache,
    Resolvers,
} from '@apollo/client';
import {
    User,
    MutationRegisterArgs,
    Recipient,
    MutationCreateRecipientArgs,
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
    AppCollection as GraphQLAppCollection,
    AcceptJobPayload,
    MutationAcceptJobArgs,
    TrackableStatus,
    MetadataEntry,
    MutationCompleteJobArgs,
    CompleteJobPayload,
    MutationPickupDonationArgs,
    PickupPayload,
} from '../generated/graphql'
import { ChainTree, EcdsaKey, setDataTransaction, setOwnershipTransaction, IResolveResponse,Community } from 'tupelo-lite'
import { AppUser } from './user';
import { makeExecutableSchema } from 'graphql-tools';
import { SchemaLink } from '@apollo/link-schema';
import { getAppCommunity} from './community';
import { appUser } from './user';
import { User as UserIdentity } from './identity'
import { CURRENT_USER } from './queries';
import { AppCollection } from './collection';
import debug from 'debug';
import { Drivers } from './drivers';
import { RecipientCollection, createRecipientTree, recipientNamePath, recipientAddressPath, recipientInstructionsPath } from './recipient'

const GraphQLJSON = require('graphql-type-json');

export const userNamespace = 'givingchain-v2' // increment this to reset data
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

const appCollection = new AppCollection({ name: `${userNamespace}/trackables`, namespace: userNamespace })

const drivers = new Drivers({ region: 'DRIVERS', namespace: `${userNamespace}/drivers` })
const recipients = new RecipientCollection('princeton, nj')

// there is a crappy IPLD bug where if you're resolving to something that has a value of undefined
// then IPLD will error with 'Cannot convert undefined or null to object'
const resolveWithUndefined = async (tree: ChainTree, path: string): Promise<IResolveResponse> => {
    try {
        return await tree.resolveData(path)
    } catch (err) {
        if (err.message.includes('Cannot convert undefined or null to object')) {
            return {
                remainderPath: [],
                value: undefined,
            }
        }
        throw err
    }
}

/**
 * Looks up the user account chaintree for the given username, returning it if
 * it exists.
 */
const findUserAccount = async (username: string, appNamespace: Uint8Array): Promise<ChainTree | undefined> => {
    const community = await getAppCommunity()

    const insecureKey = await EcdsaKey.passPhraseKey(Buffer.from(username), appNamespace)
    const did = insecureKey.toDid()

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

const loadCurrentUser = async (user: string): Promise<UserIdentity | undefined> => {
    if (!appUser.userPromise) {
        return undefined
    }

    let loggedinUser = await appUser.userPromise
    if (!loggedinUser || (loggedinUser.did !== user)) {
        return undefined
    }

    return loggedinUser
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

function now(): string {
    return (new Date()).toISOString()
}

const resolvers: Resolvers = {
    JSON: GraphQLJSON,
    User: {
        username: async (user: User): Promise<String> => {
            const c = await getAppCommunity()
            const tree = await c.getLatest(user.did)
            return resolveUsername(tree)
        },
        collection: async (user: User, { communityPromise }: TrackerContext): Promise<TrackableCollection | undefined> => {
            const c = await getAppCommunity()

            const tree = await c.getLatest(user.did)
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
        collaborators: async (trackable: Trackable): Promise<TrackableCollaboratorConnection> => {
            const did = trackable.did
            const tree = await (await getAppCommunity()).getLatest(did)
            const resp = await tree.resolveData("collaborators")
            if (!resp.value) {
                return { edges: [] }
            }
            const edges = Object.keys(resp.value).map((did: string) => {
                return { did }
            })

            return { edges }
        },
        name: async (trackable: Trackable): Promise<string> => {
            if (trackable.name) {
                return trackable.name
            }
            log("name trackable: ", trackable)
            const did = trackable.did
            const tree = await (await getAppCommunity()).getLatest(did)
            return (await resolveWithUndefined(tree, "name")).value
        },
        status: async (trackable: Trackable): Promise<TrackableStatus | null> => {
            if (trackable.status) {
                return trackable.status
            }
            log("status trackable: ", trackable)
            const tree = await (await getAppCommunity()).getLatest(trackable.did)
            return (await resolveWithUndefined(tree, "status")).value
        },
        driver: async (trackable: Trackable): Promise<User | null> => {
            if (trackable.driver) {
                return trackable.driver
            }
            log("driver trackable: ", trackable)
            const tree = await (await getAppCommunity()).getLatest(trackable.did)
            const driver = (await resolveWithUndefined(tree, "driver")).value
            if (!driver) {
                return null
            }
            return { did: driver }
        },
        image: async (trackable: Trackable): Promise<string | null> => {
            if (trackable.image) {
                return trackable.image
            }
            log("image trackable: ", trackable)
            const did = trackable.did
            const tree = await (await getAppCommunity()).getLatest(did)
            return (await resolveWithUndefined(tree, "image")).value
        },
        metadata: async (trackable: Trackable): Promise<MetadataEntry[]> => {
            if (trackable.metadata) {
                return trackable.metadata
            }
            log("trackable metadata")
            const tree = await (await getAppCommunity()).getLatest(trackable.did)
            return (await resolveWithUndefined(tree, "metadata")).value
        },
        updates: async (trackable: Trackable,): Promise<TrackableUpdateConnection> => {
            log("updates trackable: ", trackable)

            const did = trackable.did
            const tree = await (await getAppCommunity()).getLatest(did)
            let updates = await tree.resolveData("updates")
            log("updates from resolve: ", updates.value)
            if (updates.value) {
                // updates is a map of timestamp to TrackableUpdate
                let edges = await Promise.all(Object.keys(updates.value).map(async (timestamp) => {
                    let update = (await tree.resolveData(`updates/${timestamp}`)).value
                    log("resolved update: ", update)
                    update.did = `${did}-${timestamp}`
                    return update
                }))
                return { edges }
            }

            return {
                edges: [],
            }
        }
    },
    TrackableCollection: {
        trackables: async (collection: TrackableCollection): Promise<Trackable[]> => {
            const tree = await (await getAppCommunity()).getLatest(collection.did)
            // this will be a map of timestamp to did
            const trackableResp = (await resolveWithUndefined(tree, "updates"))
            log(trackableResp)
            const trackables = trackableResp.value
            if (!trackables) {
                return []
            }
            return Object.keys(trackables).map((timestamp: string) => {
                const did: string = trackables[timestamp]
                return { did, updates: {} }
            })
        }
    },
    Recipient: {
        name: async (recipient: Recipient): Promise<String> => {
            const tree = await (await getAppCommunity()).getLatest(recipient.did)
            return (await tree.resolveData(recipientNamePath)).value
        },
        address: async (recipient: Recipient): Promise<String> => {
            const tree = await (await getAppCommunity()).getLatest(recipient.did)
            return (await tree.resolveData(recipientAddressPath)).value
        },
        instructions: async (recipient: Recipient): Promise<String> => {
            const tree = await (await getAppCommunity()).getLatest(recipient.did)
            return (await tree.resolveData(recipientInstructionsPath)).value
        },
    },
    Query: {
        getTrackables: async (_root, _ctx: TrackerContext): Promise<GraphQLAppCollection> => {
            const trackables = await appCollection.getTrackables()
            return {
                did: (await (await appCollection.treePromise).id())!,
                trackables: trackables,
            }
        },
        getTrackable: async (_root, { did }: QueryGetTrackableArgs) => {
            log("get trackable: ", did)
            const c = await getAppCommunity()
            const tree = await c.getLatest(did)
            return {
                did: await tree.id(),
            }
        },
        getRecipients: async (_root, _ctx: TrackerContext): Promise<Recipient[]> => {
            log("getRecipients")
            const recs = await recipients.getAll()
            log("afterGet")
            return recs.map((did: string) => {
                return { did: did }
            })
        },
        getFirstRecipient: async (_root, _ctx: TrackerContext): Promise<Recipient | null> => {
            const recipient = await recipients.getFirst()
            if (recipient) {
                return { did: recipient }
            } else {
                return null
            }
        },
        me: async (): Promise<User | undefined> => {
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
        createTrackable: async (_root, { input }: MutationCreateTrackableArgs, { communityPromise }: TrackerContext): Promise<CreateTrackablePayload | undefined> => {
            log('createTrackable')
            const key = EcdsaKey.generate()
            const c = await communityPromise

            log('creating trackable tree')
            const tree = await ChainTree.newEmptyTree(c.blockservice, key)

            log("creating trackable from input:", input)
            let trackableObj = {
                name: input.name,
                image: input.image,
                status: TrackableStatus.Published,
                metadata: [{ key: "location", value: input.address }],
            }

            let message = "ready for pickup"
            if ((input?.instructions?.trim() || "").length > 0) {
                message = `${message}: ${input?.instructions?.trim()}`
            }
            let timestamp = now()

            let update: TrackableUpdate = {
                did: `${(await tree.id())}-${timestamp}`,
                timestamp: timestamp,
                message: message,
            }

            log("playing Tupelo transactions for trackable")
            await c.playTransactions(tree, [
                setDataTransaction("/", trackableObj),
                setDataTransaction(`updates/${timestamp}`, update),
                setOwnershipTransaction(await drivers.graftableOwnership())
            ])

            let trackable: Trackable = {
                did: (await tree.id())!,
                updates: {
                    edges: [
                        update
                    ]
                },
                ...trackableObj
            }

            log('adding trackable to app collection')
            await appCollection.addTrackable(trackable)

            log("returning new trackable:", trackable)
            return { trackable }
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
        addCollaborator: async (_root, { input: { trackable, username } }: MutationAddCollaboratorArgs, { communityPromise }: TrackerContext): Promise<AddCollaboratorPayload | undefined> => {
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
                return { code: 404 }
            }
            let collaboratorAuths = (await collaboratorTree.resolve("tree/_tupelo/authentications")).value

            const trackableTree = await (await communityPromise).getLatest(trackable)
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
        addUpdate: async (_root, { input: { trackable, message, metadata } }: MutationAddUpdateArgs, { communityPromise }: TrackerContext): Promise<AddUpdatePayload | undefined> => {
            const user = await appUser.userPromise
            await user?.load()
            if (!user) {
                throw new Error("you must be logged in to make an update")
            }

            let timestamp = now()

            const trackableTree = await (await communityPromise).getLatest(trackable)
            trackableTree.key = user.tree.key

            let update: TrackableUpdate = {
                did: `${(await trackableTree.id())}-${timestamp}`,
                timestamp: timestamp,
                message: message,
                metadata: metadata,
                userDid: user?.did,
                userName: user?.userName,
            }
            log("update: ", update)
            let c = await communityPromise
            await c.playTransactions(trackableTree, [setDataTransaction(`updates/${timestamp}`, update)])
            return {
                update: update,
            }

        },
        register: async (_root, { username, password }: MutationRegisterArgs, ctx: TrackerContext): Promise<User | undefined> => {
            const c = await ctx.communityPromise
            console.log("registering")
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

            let tree = await ChainTree.newEmptyTree(c.blockservice, appKey)
            const did = await tree.id()

            log('setting data on ', did)
            await Promise.all([
                c.playTransactions(user.tree, [setDataTransaction(pathToTree, did)]),
                c.playTransactions(tree, [setOwnershipTransaction([user.tree.key!.address()])]),
            ])
            await drivers.addDriver(user)

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
        acceptJob: async (_root, { input: { user, trackable } }: MutationAcceptJobArgs, { cache }: TrackerContext): Promise<AcceptJobPayload | undefined> => {
           
            const c = await getAppCommunity()
            let loggedinUser = await loadCurrentUser(user)
            if (!loggedinUser || (loggedinUser.did !== user)) {
                return undefined
            }

            let timestamp = now()

            const trackableTree = await c.getLatest(trackable)
            trackableTree.key = loggedinUser.tree.key

            let update: TrackableUpdate = {
                did: `${(await trackableTree.id())}-${timestamp}`,
                timestamp: timestamp,
                message: "Accepted the delivery",
                userDid: loggedinUser.did!,
                userName: loggedinUser.userName,
            }
            log("update: ", update)
            const driversTree = await drivers.treePromise
            const driversDid = await driversTree.id()

            await c.playTransactions(trackableTree, [
                setDataTransaction('driver', loggedinUser.did!),
                setDataTransaction('status', TrackableStatus.Accepted),
                setDataTransaction(`updates/${timestamp}`, update),
                setOwnershipTransaction([loggedinUser.did, driversDid!]),
                setDataTransaction(`collaborators/${loggedinUser.did}`, true),
            ])

            // then mark it owned on the appCollection
            await appCollection.ownTrackable({ did: trackable, updates: {} }, { did: user })
        },

        pickupDonation: async (_root, { input: { user, trackable, imageUrl } }: MutationPickupDonationArgs): Promise<PickupPayload | undefined> => {
            const c = await getAppCommunity()
            let loggedinUser = await loadCurrentUser(user)
            if (!loggedinUser || (loggedinUser.did !== user)) {
                return undefined
            }

            let timestamp = now()

            const trackableTree = await c.getLatest(trackable)
            trackableTree.key = loggedinUser.tree.key

            let update: TrackableUpdate = {
                did: `${(await trackableTree.id())}-${timestamp}`,
                timestamp: timestamp,
                message: "Picked up the donation",
                userDid: loggedinUser.did!,
                userName: loggedinUser.userName,
                metadata: [{ key: "confirmationImage", value: imageUrl }],
            }
            log("update: ", update)

            await c.playTransactions(trackableTree, [
                setDataTransaction('status', TrackableStatus.PickedUp),
                setDataTransaction('confirmation/pickup/image', imageUrl),
                setDataTransaction(`updates/${timestamp}`, update),
            ])

            let updatedTrackable: Trackable = {
                did: (await trackableTree.id())!,
                updates: {
                    edges: [
                        update
                    ]
                },
            }

            return { trackable: updatedTrackable }
        },

        completeJob: async (_root, { input: { user, trackable, recipient } }: MutationCompleteJobArgs): Promise<CompleteJobPayload | undefined> => {
            log("completeJob")
            const c = await getAppCommunity()

            let currentUser = await loadCurrentUser(user)
            if (!currentUser || (currentUser.did !== user)) {
                return undefined
            }

            let timestamp = now()

            const trackableTree = await c.getLatest(trackable)
            trackableTree.key = currentUser.tree.key

            let update: TrackableUpdate = {
                did: `${(await trackableTree.id())}-${timestamp}`,
                timestamp: timestamp,
                message: "Delivered",
                userDid: currentUser.did!,
                userName: currentUser.userName,
            }

            log("update: ", update)

            await c.playTransactions(trackableTree, [
                setDataTransaction('status', TrackableStatus.Delivered),
                setDataTransaction(`updates/${timestamp}`, update),
                setOwnershipTransaction([recipient!]),
            ])

            let updatedTrackable: Trackable = {
                did: (await trackableTree.id())!,
                updates: {
                    edges: [
                        update
                    ]
                },
            }

            return { trackable: updatedTrackable }
        },

        createRecipient: async (_root, { name, password, address, instructions }: MutationCreateRecipientArgs, _context: TrackerContext): Promise<Recipient> => {
            log("createRecipient")

            let recipientTree = await createRecipientTree(name, password, address, instructions)
            const id = await recipientTree.id()
            let newRecipient = {
                did: id!,
                name: name,
                address: address,
                instructions: instructions,
            }
            log("new recipient: ", newRecipient)
            recipients.add(newRecipient)

            return newRecipient
        },
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
