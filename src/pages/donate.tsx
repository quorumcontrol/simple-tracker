import {
    Box,
    Flex,
    Button,
    FormControl,
    Text,
    Input,
    FormErrorMessage,
    Stack,
    Textarea,
    Icon,
} from "@chakra-ui/core";
import React, { useState, useEffect } from 'react';
import Header from "../components/header";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";
import debug from "debug";
import { Trackable, MetadataEntry, CreateTrackablePayload, CreateTrackableInput } from '../generated/graphql';
import { useHistory } from "react-router-dom";
import { upload } from "../lib/skynet";

const log = debug("pages.donate")

// TODO: There's probably a better place to define this
export type Address = {
    street: string
    cityStateZip: string
}

type DonationData = {
    pickupAddr: Address
    instructions: string
    image: FileList
}

const CREATE_DONATION_MUTATION = gql`
  mutation DonatePageCreate($input: CreateTrackableInput!) {
    createTrackable(input: $input) {
      trackable {
        did
      }
    }
  }
`

const UPDATE_DONATION_MUTATION = gql`
  mutation UpdateDonation($input: AddUpdateInput!) {
    addUpdate(input: $input) {
      did
      message
      metadata
    }
  }
`

export function DonatePage() {
    const [createDonation, { error: createError }] = useMutation(CREATE_DONATION_MUTATION)
    const [updateDonation, { error: updateError }] = useMutation(UPDATE_DONATION_MUTATION)

    const { handleSubmit, errors, register } = useForm<DonationData>();

    const history = useHistory()

    async function onSubmit({ pickupAddr, instructions, image }: DonationData) {
        setSubmitLoading(true)
        log("submitted:", pickupAddr, instructions);

        let donationInput:CreateTrackableInput = {
            name: "donation",
        }

        if (image && image.length > 0) {
            const { skylink } = await upload(image, {})
            donationInput.image = skylink
        }

        const result = await createDonation({
            variables: { input: donationInput }
        })

        const payload: CreateTrackablePayload = result.data.createTrackable
        const donation: Trackable = payload.trackable!

        log("createDonation result:", donation)

        let metadata: MetadataEntry[] = []

        metadata.push({ key: "location", value: pickupAddr })

        log("adding metadata:", metadata)

        let message = "ready for pickup"
        if (instructions.trim().length > 0) {
            message = `${message}: ${instructions.trim()}`
        }

        await updateDonation({
            variables: {
                input: {
                    trackable: donation.did,
                    message: message,
                    metadata: metadata,
                }
            }
        })

        history.push(`/donation/${donation.did}/thanks`)
    }

    let imageFileField: HTMLInputElement
    const imageRefHandler = (el: HTMLInputElement) => {
        register()(el)
        imageFileField = el
    }

    const [imageAdded, setImageAdded] = useState(false)

    const handleAddedImage = () => {
        setImageAdded(true)
    }

    const [submitLoading, setSubmitLoading] = useState(false)

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column" align="center" justify="center">
                <form onSubmit={handleSubmit(onSubmit)}>
                    {
                        imageAdded ?
                        <Box display="inline-flex"><Icon color="green" name="check" mr={5} /> Picture attached</Box>
                        :
                        <Button leftIcon="attachment" onClick={() => imageFileField.click()}>Take a Picture</Button>
                    }
                    <Input
                        hidden
                        id="imageFileField"
                        name="image"
                        type="file"
                        ref={imageRefHandler}
                        onChange={handleAddedImage}
                    />
                    <FormErrorMessage>
                        {errors.image && "There was a problem uploading your picture"}
                    </FormErrorMessage>
                    <Stack mt={10} spacing={3}>
                        <Text>Address for Pickup</Text>
                        <FormControl isInvalid={!!errors.pickupAddr?.street}>
                            <Input
                                name="pickupAddr.street"
                                placeholder="Street Address"
                                ref={register({ required: "Street Address is required" })}
                            />
                            <FormErrorMessage>
                                {errors.pickupAddr && errors.pickupAddr.street && (errors.pickupAddr.street.message)}
                            </FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={!!errors.pickupAddr?.cityStateZip}>
                            <Input
                                name="pickupAddr.cityStateZip"
                                placeholder="City, ST Zip"
                                ref={register({ required: "City, ST Zip is required" })}
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
                            {updateError && (updateError.message)}
                        </FormErrorMessage>
                    </Stack>
                </form>
            </Flex>
        </Box>
    )
}
