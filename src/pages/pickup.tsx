import React, { useState } from 'react'
import { useForm } from "react-hook-form";
import { useParams } from 'react-router-dom'
import { gql, useQuery, useMutation } from '@apollo/client'
import { useHistory } from "react-router-dom";
import Header from '../components/header'
import LoadingSpinner from '../components/loading'
import ShowError from '../components/errors'
import { DonationTime } from "../components/donation";
import { Box, Button, Flex, FormErrorMessage, Stack } from '@chakra-ui/core'
import { PickupInput, PickupPayload, Trackable } from '../generated/graphql'
import { PictureButton } from "../components/pictureForm";
import { sortUpdates } from "../store/trackables";
import debug from 'debug'

const log = debug("pages.pickup")

const PICKUP_QUERY = gql`
    query PickupInfo($did: ID!) {
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
                    timestamp
                }
            }
        }
    }
`

const PICKUP_MUTATION = gql`
    mutation PickupDonation($input: PickupInput!) {
        pickupDonation(input: $input){
            user
            trackable
            imageUrl
        }
    }
`

type PickupData = {
    image: FileList
}

export function PickupPage() {
    const { objectId } = useParams()
    const { data, loading, error } = useQuery(PICKUP_QUERY, { variables: { did: objectId! } })
    const [pickupDonation, { error: pickupError }] = useMutation(PICKUP_MUTATION)

    const { handleSubmit, errors, register } = useForm<PickupData>();
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


    if (error) {
        return ShowError(error)
    } else if (loading) {
        return LoadingSpinner("Loading donation")
    } else {
        trackable = data.getTrackable
    }

    log("pickup data: ", data)

    const sortedUpdates = sortUpdates(trackable)
    const firstUpdate = sortedUpdates && sortedUpdates[0]

    async function onSubmit({ image }: PickupData) {
        setSubmitLoading(true)

        let pickupInput: PickupInput = {
            user: data.me.did,
            trackable: objectId,
        }

        const [imageURL] = imageState.url
        if (imageURL.length > 0) {
            pickupInput.imageUrl = imageURL
        }

        const result = await pickupDonation({
            variables: { input: pickupInput }
        })

        const payload: PickupPayload = result.data.pickupDonation
        const donation: Trackable = payload.trackable!

        log("pickupDonation result:", donation)

        history.push(`/objects/${objectId}/dropoff`)
    }
    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column" align="center" justify="center">
                <Stack spacing={5}>
                    {DonationTime(trackable, firstUpdate)}
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <PictureButton formRegister={register} imageState={imageState} buttonText="Add photo confirmation" />
                        <FormErrorMessage>
                            {errors.image && "There was a problem uploading your picture"}
                        </FormErrorMessage>
                        <Button type="submit" isLoading={submitLoading} isDisabled={imageUploading}>Pick Up Donation</Button>
                        <FormErrorMessage>
                            {pickupError && (pickupError.message)}
                        </FormErrorMessage>
                    </form>
                </Stack>
            </Flex>
        </Box>
    )
}
