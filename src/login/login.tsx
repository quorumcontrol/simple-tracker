import React, { useState } from 'react'
import { Box, Flex, FormControl, FormLabel, FormErrorMessage, Button, Input, Heading, Link} from '@chakra-ui/core'
import { useForm } from "react-hook-form";
import { useAmbientUser } from 'ambient-react';
import { Redirect, Link as RouterLink} from 'react-router-dom';

type LoginFormData = {
    username: string;
    password: string;
  };

export function LoginPage() {
    const { handleSubmit, errors, setError, register, formState } = useForm<LoginFormData>();
    const { login } = useAmbientUser()
    const [loginSuccess,setLoginSuccess] = useState(false)

    async function onSubmit({username,password}:LoginFormData) {
        const [found] = await login(username, password)
        if (!found) {
            setError("username", "not found", "User not found")
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
            <Heading>Login</Heading>
            <Box borderWidth="1px" rounded="lg" p={8} mt={2}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormControl isInvalid={!!errors.username}>
                        <FormLabel htmlFor="username">Username</FormLabel>
                        <Input
                            name="username"
                            placeholder="Username"
                            ref={register({ required: "Username is required" })}
                        />
                        <FormErrorMessage>
                            {errors.username && (errors.username.message)}
                        </FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors.password} mt={5}>
                        <FormLabel htmlFor="password">Password</FormLabel>
                        <Input
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
                <Box mt={4}>
                    <RouterLink to="/register">
                        <Link as="text">Or Register</Link>
                    </RouterLink>
                </Box>
            </Box>
        </Flex>
    )
}