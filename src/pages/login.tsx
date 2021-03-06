import React, { useState, useEffect } from 'react'
import { Box, Flex, FormControl, FormLabel, FormErrorMessage, Button, Input, Heading, Link } from '@chakra-ui/core'
import { useForm } from "react-hook-form";
import { Redirect } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { userNamespace } from '../store/index'

const LOGIN_USER = gql`
    mutation LoginUser($namespace: String!, $username: String!, $password: String!) {
        login(namespace: $namespace, username: $username, password: $password) {
            did
            username
            loggedIn
        }
    }
`

type LoginFormData = {
    username: string;
    password: string;
};

export function LoginPage() {
    const { handleSubmit, errors, setError, register, formState } = useForm<LoginFormData>();

    const [loginUser, resp] = useMutation(LOGIN_USER)
    const data = resp.data

    useEffect(() => {
        if (resp.loading || !resp.called) {
            return
        }
        if (!data || !data.login) {
            setError("username", "not found", "User not found")
            return
        }
        setLoginSuccess(true)
    }, [resp.called, resp.loading, data, setError])


    // const { login } = useAmbientUser()
    const [loginSuccess, setLoginSuccess] = useState(false)

    async function onSubmit({ username, password }: LoginFormData) {
        try {
            await loginUser({ variables: { username, password, namespace: userNamespace.toString()! } })
        } catch (e) {
            setError("username", "unknown", `Could not create that user: ${e.message}`)
        }
    }

    if (loginSuccess) {
        return (
            <Redirect
                to={{
                    pathname: "/summary",
                }}
            />
        )
    }

    return (
        <Flex align="center" justify="center" h="100%" flexDir="column">
            <Heading>Giving Chain<br />Driver Login</Heading>
            <Box borderWidth="1px" rounded="lg" p={8} mt={2}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormControl isInvalid={!!errors.username}>
                        <FormLabel htmlFor="username">Email</FormLabel>
                        <Input
                            id="username"
                            name="username"
                            placeholder="Email"
                            ref={register({
                                required: "Email is required",
                                pattern: {
                                    value: /^\S+@\S+$/,
                                    message: 'Please enter a valid email address',
                                }
                            })}
                        />
                        <FormErrorMessage>
                            {errors.username && (errors.username.message)}
                        </FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors.password} mt={5}>
                        <FormLabel htmlFor="password">Password</FormLabel>
                        <Input
                            id="password"
                            name="password"
                            placeholder="Password"
                            type="password"
                            ref={register({ required: true })}
                        />
                        <FormErrorMessage>
                            {errors.password && "Password is required"}
                        </FormErrorMessage>
                    </FormControl>
                    <Button
                        mt={5}
                        variantColor="teal"
                        isLoading={formState.isSubmitting}
                        type="submit"
                    >
                        Login
                    </Button>
                </form>
            </Box>
        </Flex>
    )
}
