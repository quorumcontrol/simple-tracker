import {gql} from '@apollo/client'

export const schema = gql`
scalar JSON

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
    updates: TrackableUpdateConnection!
    collaborators: TrackableCollaboratorConnection
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
    userDid: String!
    userName: String!
}

type MetadataEntry {
    key: String!
    value: JSON
}

type TrackableCollection {
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

type Query {
    getTrackable(did: ID!):Trackable
    me: User
}

type Mutation {
    login(namespace: String!, username: String!, password: String!): User
    register(namespace: String!, username: String!, password: String!): User
    logout(did:String): User
    createTrackable(input:CreateTrackableInput!): CreateTrackablePayload
    addUpdate(input:AddUpdateInput!): AddUpdatePayload
    addCollaborator(input: AddCollaboratorInput!):AddCollaboratorPayload
}
`

export default schema