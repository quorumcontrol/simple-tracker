import { Box, Flex, Button, FormControl, Text, Input, FormErrorMessage, Stack, Textarea } from "@chakra-ui/core";
import React, { useState } from 'react';
import Header from "../components/header";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";
import debug from "debug";

const log = debug("pages.donate")

type Address = {
  street:       string;
  cityStateZip: string;
}

type DonationData = {
  pickupAddr:   Address;
  instructions: string;
}

const CREATE_DONATION_MUTATION = gql`
  mutation DonatePageCreate($input: CreateTrackableInput!) {
    createUnownedTrackable(input: $input) {
      code
    }
  }
`

export function DonatePage() {
  const [createDonation, { error: createError }] = useMutation(CREATE_DONATION_MUTATION)
  const { handleSubmit, errors, setError, register, formState } = useForm<DonationData>();

  async function onSubmit({pickupAddr,instructions}:DonationData) {
    setSubmitLoading(true)
    log("submitted:", pickupAddr, instructions);

    // first create the trackable
    // TODO: Add the image once that's working
    await createDonation({
      variables: {input: {name: "donation"}}
    })

    // TODO: add the location in an update
    // How do we get the new trackable?

    setSubmitLoading(false)
  }

  const [submitLoading, setSubmitLoading] = useState(false)

  return (
    <Box>
      <Header />
      <Flex mt={5} p={10} flexDirection="column" align="center">
        <Button>Take a Picture</Button>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Text mt={10}>Address for Pickup</Text>
            <FormControl isInvalid={!!errors.pickupAddr?.street}>
              <Input
                name="pickupAddr.street"
                placeholder="Street Address"
                ref={register({ required: "Street Address is required"})}
              />
              <FormErrorMessage>
                {errors.pickupAddr && errors.pickupAddr.street && (errors.pickupAddr.street.message)}
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.pickupAddr?.cityStateZip}>
              <Input
                name="pickupAddr.cityStateZip"
                placeholder="City, ST Zip"
                ref={register({ required: "City, ST Zip is required"})}
              />
              <FormErrorMessage>
                {errors.pickupAddr && errors.pickupAddr.cityStateZip && (errors.pickupAddr.cityStateZip)}
              </FormErrorMessage>
            </FormControl>
          </Stack>
          <Stack mt={10} spacing={3}>
            <Text>Special Pickup Instructions?</Text>
            <FormControl>
              <Textarea
                name="instructions"
                placeholder="By mailbox?, Backporch?"
                ref={register()}>
              </Textarea>
            </FormControl>
            <Button type="submit" isLoading={submitLoading}>Done</Button>
            <FormErrorMessage>
              {createError && (createError.message)}
            </FormErrorMessage>
          </Stack>
        </form>
      </Flex>
    </Box>
  )
}