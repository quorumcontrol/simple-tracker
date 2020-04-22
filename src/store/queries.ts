import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
    {
        me {
            did
            username
            loggedIn
        }
    }
`

export const LOGOUT_USER = gql`
    mutation Logout($did: String!) {
        logout(did:$did) {
            did
            loggedIn
        }
    }
`