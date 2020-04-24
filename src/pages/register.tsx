import React, { useState } from 'react'
import { Box, Flex, FormControl, FormLabel, FormErrorMessage, Button, Input, Heading, Link } from '@chakra-ui/core'
import { useForm } from "react-hook-form";
import { Redirect, Link as RouterLink } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import {userNamespace} from '../store/index';

type RegistrationFormData = {
    username: string;
    password: string;
    passwordConfirmation: string
};

const REGISTER_USER = gql`
    mutation RegisterUser($namespace: String!, $username: String!, $password: String!) {
        register(namespace: $namespace, username: $username, password: $password) {
            did
            username
            loggedIn
        }
    }
`

export function RegisterPage() {
    const { handleSubmit, errors, setError, register, formState } = useForm<RegistrationFormData>();
    // const userMethods = useAmbientUser()
    // const registerUser = userMethods.register

    const [registerUser,] = useMutation(REGISTER_USER)
    const [loginSuccess, setLoginSuccess] = useState(false)

    async function onSubmit({ username, password, passwordConfirmation }: RegistrationFormData) {
        if (password !== passwordConfirmation) {
            setError("password", "invalid", "password confirmation doesn't match")
            return
        }
        try {
            await registerUser({variables: {username: username, password: password, namespace: userNamespace} })
        } catch (e) {
            setError("username", "unknown", `Could not create that user: ${e.message}`)
            return
        }
        setLoginSuccess(true)
    }

    if (loginSuccess) {
        return (
            <Redirect
                to={{
                    pathname: "/",
                }}
            />
        )
    }

    return (
        <Flex align="center" justify="center" h="100%" flexDir="column">
             <Heading>Giving Chain<br/>Driver Signup</Heading>
             <Box borderWidth="1px" rounded="lg" p={8} mt={2}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormControl isInvalid={!!errors.username}>
                        <FormLabel htmlFor="username">Email</FormLabel>
                        <Input
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
                            {errors.username && errors.username.message}
                        </FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors.password} mt={5}>
                        <FormLabel htmlFor="password">Password</FormLabel>
                        <Input
                            name="password"
                            placeholder="Password"
                            type="password"
                            ref={register({ required: "Password is required" })}
                        />
                        <FormErrorMessage>
                            {errors.password && errors.password.message}
                        </FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors.passwordConfirmation} mt={5}>
                        <FormLabel htmlFor="passwordConfirmation">Re-Type your password</FormLabel>
                        <Input
                            name="passwordConfirmation"
                            placeholder="Password Confirmation"
                            type="password"
                            ref={register({ required: "Password confirmation is required" })}
                        />
                        <FormErrorMessage>
                            {errors.passwordConfirmation && errors.passwordConfirmation.message}
                        </FormErrorMessage>
                    </FormControl>
                    <Button
                        mt={5}
                        variantColor="teal"
                        isLoading={formState.isSubmitting}
                        type="submit"
                    >
                        Register
                    </Button>
                </form>
                <Box mt={4}>
                    <RouterLink to="/Login">
                        <Link as="text">Or Login</Link>
                    </RouterLink>
                </Box>
            </Box>
        </Flex>
    )
}