import {gql} from '@apollo/client'

export const schema = gql`
# scalar CID

type User {
    did: ID!
    username: String
    namespace: String
    loggedIn: Boolean
    collection: TrackableCollection
}

type Trackable {
    did: ID!
    name: String
    image: String #skynet URL for now
    updates: TrackableUpdateConnection
}

type TrackableUpdateConnection {
    did: ID!
    edges: [TrackableUpdate]
}

type TrackableUpdate {
    id: ID!
    timestamp: String # ISO standard string
    message: String
    metadata: [MetadataEntry]
    userDid: String!
    userName: String!
}

type MetadataEntry {
    key: String!
    value: String
}

type TrackableConnection {
    edges: [TrackableEdge]
}

type TrackableEdge {
    did: ID!
    node: Trackable
}

type TrackableCollection {
    did: ID!
    trackables: TrackableConnection
}

type Query {
    me: User
}

input CreateTrackableInput {
    name: String!
    image: String
}

type CreateTrackablePayload {
    collection: TrackableCollection
    trackable: Trackable
}

type Mutation {
    login(namespace: String!, username: String!, password: String!): User
    register(namespace: String!, username: String!, password: String!): User
    logout(did:String): User
    createTrackable(input:CreateTrackableInput!): CreateTrackablePayload
}
`

export default schema