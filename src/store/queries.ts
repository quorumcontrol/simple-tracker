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

export const REGISTER_USER = gql`
    mutation RegisterUser($namespace: String!, $username: String!, $password: String!) {
        register(namespace: $namespace, username: $username, password: $password) {
            did
            username
            loggedIn
        }
    }
`

export const LOGIN_USER = gql`
    mutation LoginUser($namespace: String!, $username: String!, $password: String!) {
        login(namespace: $namespace, username: $username, password: $password) {
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