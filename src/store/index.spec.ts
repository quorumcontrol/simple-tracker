import 'mocha'
import { expect } from 'chai'
import { client, userNamespace } from './index'
import { gql } from '@apollo/client'
import { CURRENT_USER } from './queries'


// right now the tests are stateful (state sticks around between tests)
// so this is really just a "does it actually run" kind of test rather
// than really asserting anything useful.
describe('resolvers', () => {
    const userEmail = `tester-${Math.random()}@testhead.eth`
    const password = 'password' // I like to live dangerously

    before(async ()=> {
        const registerMutation = gql`
            mutation RegisterUser($namespace: String!, $username: String!, $password: String!) {
                register(namespace: $namespace, username: $username, password: $password) {
                    did
                    username
                    loggedIn
                }
            }
        `

        const resp = await client.mutate({
            mutation: registerMutation,
            variables: {namespace: userNamespace, username: userEmail, password: password}
        })
        expect(resp.error).to.be.undefined
    })

    it('queries trackables', async () => {

        const query = gql`
            query GetTrackables($filters: GetTrackablesFilter) {
                getTrackables(filters: $filters) {
                    did
                    trackables {
                        did
                    }
                }
            }
        `
        const resp = await client.query({
            query: query
        })

        expect(resp.data.getTrackables.trackables).to.be.an("Array")
    })

    it('can accept jobs', async ()=> {
        const acceptMutation = gql`
            mutation AcceptJob($input: AcceptJobInput) {
                acceptJob(input: $input) {
                    trackable {
                        did
                    }
                }
            }
        `

        const createTrackableMutation = gql`
        mutation CreateTrackable($input: CreateTrackableInput!) {
            createTrackable(input: $input) {
                trackable {
                    did
                }
            }
        }
    `

        const currUserResp = await client.query({query: CURRENT_USER})
        expect(currUserResp.errors).to.be.undefined

        const createTrackableResp = await client.mutate({
            mutation: createTrackableMutation,
            variables: {input: {name: "testtrackable"}}
        }) 
        expect(createTrackableResp.error).to.be.undefined

        const resp = await client.mutate({
            mutation: acceptMutation,
            variables: {input: {user: currUserResp.data.me.did, trackable: createTrackableResp.data.createTrackable.trackable.did}}
        })

        expect(resp.error).to.be.undefined
    })
})