import React from 'react'
import { Box, Flex, FormControl, FormLabel, FormErrorMessage, Button, Input } from '@chakra-ui/core'
import { useForm } from "react-hook-form";

const sleep = (ms:number) => new Promise(resolve => setTimeout(resolve, ms));

type LoginFormData = {
    username: string;
    password: string;
  };

export function LoginPage() {
    const { handleSubmit, errors, register, formState } = useForm<LoginFormData>();

    async function onSubmit({username,password}:LoginFormData) {
        await sleep(2000)
        console.log("username/p ", username, password)
    }

    return (
        <Flex align="center" justify="center" h="100%">
            <Flex borderWidth="1px" rounded="lg" p={10}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormControl isInvalid={!!errors.username}>
                        <FormLabel htmlFor="username">Username</FormLabel>
                        <Input
                            name="username"
                            placeholder="Username"
                            ref={register({ required: true })}
                        />
                        <FormErrorMessage>
                            {errors.username && "Username is required"}
                        </FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors.password} mt={2}>
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
                        mt={4}
                        variantColor="teal"
                        isLoading={formState.isSubmitting}
                        type="submit"
                    >
                        Submit
                    </Button>
                </form>
            </Flex>
        </Flex>
    )
}