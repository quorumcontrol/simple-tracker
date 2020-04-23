import { Box, Flex, Button, FormControl, Text, FormLabel, Input, FormErrorMessage, Stack, Textarea } from "@chakra-ui/core";
import React, { useState } from 'react';
import Header from "../components/header";
import { useForm } from "react-hook-form";

type Address = {
  street:       string;
  cityStateZip: string;
}

type DonationData = {
  pickupAddr:   Address;
  instructions: string;
}

export function DonatePage() {
  const { handleSubmit, errors, setError, register, formState } = useForm<DonationData>();

  async function onSubmit({pickupAddr,instructions}:DonationData) {
    setDoneLoading(true)
    console.log("Submitted:", pickupAddr, instructions);
  }

  const [doneLoading, setDoneLoading] = useState(false)

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
                name="street"
                placeholder="Street Address"
                ref={register({ required: "Street Address is required"})}
              />
              <FormErrorMessage>
                {errors.pickupAddr && errors.pickupAddr.street && (errors.pickupAddr.street.message)}
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.pickupAddr?.cityStateZip}>
              <Input
                name="cityStateZip"
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
            <Button type="submit" isLoading={doneLoading}>Done</Button>
          </Stack>
        </form>
      </Flex>
    </Box>
  )
}