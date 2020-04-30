import { gql } from '@apollo/client'

export const schema = gql`
scalar JSON

type User {
    did: ID!
    username: String
    namespace: String
    loggedIn: Boolean
    collection: TrackableCollection @deprecated(reason: "only drivers are users now and this field used to represent a collection a user owns")
    pendingDeliveries: TrackableCollection
    completedDeliveries: TrackableCollection
}

enum TrackableStatus {
    Created
    Published
    Accepted
    PickedUp
    Delivered
}

type Recipient {
    did: ID!
    name: String
    address: String
    instructions: String
}

type Trackable {
    did: ID!
    name: String
    image: String #skynet URL for now
    updates: TrackableUpdateConnection!
    collaborators: TrackableCollaboratorConnection
    status: TrackableStatus
    driver: User # this is only available on trackables that are part of a collection
}

type TrackableCollaboratorConnection {
    edges: [User!]
}

type TrackableUpdateConnection {
    edges: [TrackableUpdate!]
}

type TrackableUpdate {
    did: ID!
    timestamp: String! # ISO standard string
    message: String
    metadata: [MetadataEntry!]
    userDid: String
    userName: String
}

type MetadataEntry {
    key: String!
    value: JSON
}

type TrackableCollection {
    did: ID!
    trackables: [Trackable!]
}

# AppCollection is kept as a separate type from TrackableCollection
# because of how they are updated
type AppCollection {
    did: ID!
    trackables: [Trackable!]
}

input CreateTrackableInput {
    name: String!
    image: String
}

input MetadataEntryInput {
    key: String!
    value: JSON
}

input AddUpdateInput {
    trackable: ID!
    message: String!
    metadata: [MetadataEntryInput!]
}

type CreateTrackablePayload {
    collection: TrackableCollection
    trackable: Trackable
}

type AddUpdatePayload {
    update: TrackableUpdate!
}

type AddCollaboratorPayload {
    collaborator: User
    code: Int
}

input AddCollaboratorInput {
    trackable: ID!
    username: String!
}

input AcceptJobInput {
    user: ID!
    trackable: ID!
}

type AcceptJobPayload {
    trackable: Trackable
}

input GetTrackablesFilter {
    owned: Boolean
    ownedBy: String
}

type Query {
    getTrackable(did: ID!):Trackable
    getTrackables:AppCollection
    me: User
}

type Mutation {
    login(namespace: String!, username: String!, password: String!): User
    register(namespace: String!, username: String!, password: String!): User
    logout(did:String): User
    createRecipient(name: String!, password: String!, address: String!, instructions: String!): Recipient
    createTrackable(input:CreateTrackableInput!): CreateTrackablePayload
    addUpdate(input:AddUpdateInput!): AddUpdatePayload
    addCollaborator(input: AddCollaboratorInput!):AddCollaboratorPayload
    acceptJob(input: AcceptJobInput!):AcceptJobPayload
}
`

export default schema
