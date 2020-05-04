import React, { useState } from 'react'
import { Box, Flex, FormControl, FormLabel, FormErrorMessage, Button, Input, Heading, Stack, Text } from '@chakra-ui/core'
import { useForm } from "react-hook-form";
import { Redirect } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { AddressInput } from '../generated/graphql';

type RecipientFormData = {
    name: string;
    password: string;
    passwordConfirmation: string
    address: AddressInput
    instructions: String
};

const CREATE_RECIPIENT = gql`
    mutation CreateRecipient($name: String!, $password: String!, $address: AddressInput!, $instructions: String) {
        createRecipient(name: $name, password: $password, address: $address, instructions: $instructions) {
            did
            name
            address
            instructions
        }
    }
`

export function ReceivePage() {
    const { handleSubmit, errors, setError, register, formState } = useForm<RecipientFormData>();

    const [createRecipient,] = useMutation(CREATE_RECIPIENT)
    const [wasAdded, setWasAdded] = useState(false)

    async function onSubmit({ name, password, passwordConfirmation, address, instructions }: RecipientFormData) {
        if (password !== passwordConfirmation) {
            setError("password", "invalid", "password confirmation doesn't match")
            return
        }
        try {
            await createRecipient({ variables: { name: name, password: password, address: address, instructions: instructions } })
        } catch (e) {
            setError("name", "unknown", `Could not create that donation recipient: ${e.message}`)
            return
        }
        setWasAdded(true)
    }

    if (wasAdded) {
        return (
            <Redirect
                to={{
                    pathname: "/recipients",
                }}
            />
        )
    }

    return (
        <Flex align="center" justify="center" h="100%" flexDir="column">
            <Heading>Giving Chain<br />Receive Donations</Heading>
            <Box borderWidth="1px" rounded="lg" p={8} mt={2}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormControl isInvalid={!!errors.name}>
                        <FormLabel htmlFor="name">Facility Name</FormLabel>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Name"
                            ref={register({ required: "Name is required" })}
                        />
                        <FormErrorMessage>
                            {errors.name && errors.name.message}
                        </FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors.password} mt={5}>
                        <FormLabel htmlFor="password">Password</FormLabel>
                        <Input
                            id="password"
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
                            id="passwordConfirmation"
                            name="passwordConfirmation"
                            placeholder="Password Confirmation"
                            type="password"
                            ref={register({ required: "Password confirmation is required" })}
                        />
                        <FormErrorMessage>
                            {errors.passwordConfirmation && errors.passwordConfirmation.message}
                        </FormErrorMessage>
                    </FormControl>
                    <Stack mt={10} spacing={3}>
                        <Text>Address for Pickup</Text>
                        <FormControl isInvalid={!!errors.address?.street}>
                            <Input
                                name="address.street"
                                placeholder="Street Address"
                                ref={register({ required: "Street Address is required" })}
                            />
                            <FormErrorMessage>
                                {errors.address && errors.address.street && (errors.address.street.message)}
                            </FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={!!errors.address?.cityStateZip}>
                            <Input
                                name="address.cityStateZip"
                                placeholder="City, ST Zip"
                                ref={register({ required: "City, ST Zip is required" })}
                            />
                            <FormErrorMessage>
                                {errors.address && errors.address.cityStateZip && (errors.address.cityStateZip)}
                            </FormErrorMessage>
                        </FormControl>
                    </Stack>
                    <FormControl isInvalid={!!errors.instructions}>
                        <FormLabel htmlFor="name">Instructions</FormLabel>
                        <Input
                            id="instructions"
                            name="instructions"
                            placeholder="Drop Off Instructions"
                            ref={register({})}
                        />
                    </FormControl>
                    <Button
                        mt={5}
                        variantColor="teal"
                        isLoading={formState.isSubmitting}
                        type="submit"
                    >
                        Register Facility
                    </Button>
                </form>
            </Box>
        </Flex>
    )
}
