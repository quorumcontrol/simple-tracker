import React, { useState } from 'react'
import { useForm } from "react-hook-form";
import { useParams } from 'react-router-dom'
import { gql, useQuery, useMutation } from '@apollo/client'
import { useHistory } from "react-router-dom";
import Header from '../components/header'
import LoadingSpinner from '../components/loading'
import ShowError from '../components/errors'
import { UpdateTime } from "../components/donation";
import { Box, Button, Flex, FormErrorMessage, Heading, Stack, Text } from '@chakra-ui/core'
import { CompleteJobInput, CompleteJobPayload, Trackable, Recipient } from '../generated/graphql'
import { PictureButton } from "../components/pictureForm";
import { sortUpdates } from "../store/trackables";
import AddressComponent from '../components/address';
import debug from 'debug'

const log = debug("pages.dropoff")

const DROPOFF_QUERY = gql`
    query DropoffInfo($did: ID!) {
        me {
            did
        }

        getTrackable(did: $did) {
            did
            name
            image
            updates {
                edges {
                    did
                    message
                    timestamp
                }
            }
        }

        getFirstRecipient {
            did
            name
            address
            instructions
        }
    }
`

const DROPOFF_MUTATION = gql`
    mutation DeliverDonation($input: CompleteJobInput!) {
        completeJob(input: $input){
            user
            trackable
            recipient
            imageUrl
        }
    }
`

type DropoffData = {
    image: FileList
}

export function DropoffPage() {
    const { objectId } = useParams()
    const { data, loading, error } = useQuery(DROPOFF_QUERY, { variables: { did: objectId! } })
    const [dropoffDonation, { error: dropoffError }] = useMutation(DROPOFF_MUTATION)

    const { handleSubmit, errors, register } = useForm<DropoffData>();
    const history = useHistory()

    const imageState = {
        data: useState(new Blob()),
        url: useState(""),
        uploading: useState(false),
    }
    const [imageUploading] = imageState.uploading
    const [submitLoading, setSubmitLoading] = useState(false)

    let trackable: Trackable = {
        name: "Loading",
        did: objectId!,
        image: "", updates: {}
    }

    if (loading) {
        return LoadingSpinner("Loading deliveries")
    }

    if (error) {
        return ShowError(error)
    }

    log("dropoff page data: ", data)

    let recipient: Recipient;

    if (!data.getFirstRecipient) {
        return (<Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Box>
                        <Heading>No donation recipients available.</Heading>
                    </Box>
                </Box>
            </Flex>
        </Box>)
    } else {
        recipient = data.getFirstRecipient
    }

    trackable = data.getTrackable

    const sortedUpdates = sortUpdates(trackable)
    const firstUpdate = sortedUpdates && sortedUpdates[0]
    const lastUpdate = sortedUpdates && sortedUpdates[sortedUpdates.length - 1]

    async function onSubmit({ image }: DropoffData) {
        setSubmitLoading(true)

        let completeJobInput: CompleteJobInput = {
            user: data.me.did,
            trackable: objectId,
            recipient: recipient.did
        }

        const [imageURL] = imageState.url
        if (imageURL.length > 0) {
            completeJobInput.imageUrl = imageURL
        }

        const result = await dropoffDonation({
            variables: { input: completeJobInput }
        })

        const payload: CompleteJobPayload = result.data.pickupDonation
        const donation: Trackable = payload.trackable!

        log("completeJob result:", donation)

        history.push(`/summary`)
    }

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column" align="center" justify="center">
                <Stack spacing={5}>
                    {UpdateTime(trackable, "Donated", firstUpdate)}
                    {UpdateTime(trackable, "Picked up", lastUpdate)}
                    <AddressComponent addr={recipient.address} />
                    <Text>{recipient.instructions}</Text>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <PictureButton formRegister={register} imageState={imageState} buttonText="Add photo confirmation" />
                        <FormErrorMessage>
                            {errors.image && "There was a problem uploading your picture"}
                        </FormErrorMessage>
                        <Button type="submit" isLoading={submitLoading} isDisabled={imageUploading}>Drop Off Donation</Button>
                        <FormErrorMessage>
                            {dropoffError && (dropoffError.message)}
                        </FormErrorMessage>
                    </form>
                </Stack>
            </Flex>
        </Box>
    )
}
