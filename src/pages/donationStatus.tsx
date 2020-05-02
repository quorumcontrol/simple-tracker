import debug from "debug";
import React from "react";
import { Box, Flex, Text, Image, Stack, Spinner } from "@chakra-ui/core";
import Header from "../components/header";
import { useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { Trackable, TrackableUpdate } from "../generated/graphql";
import { getUrl } from "../lib/skynet";
import { getAppCommunity } from "../store/community";
import { Tupelo } from "tupelo-wasm-sdk";

const log = debug("pages.donationStatus")

const GET_TRACKABLE = gql`
    query GetTrackable($did: ID!) {
        getTrackable(did: $did) {
            did
            name
            image
            updates {
                edges {
                    did
                    message
                    metadata {
                        key
                        value
                    }
                    timestamp
                }
            }
        }
    }
`

export function DonationStatusPage() {
    const { trackableId } = useParams()

    const query = useQuery(GET_TRACKABLE, { variables: { did: trackableId! }})
    let trackable: Trackable = { name: "Loading", did: trackableId!, image: "", updates: {} }
    if (query.error) {
        throw query.error
    }
    if (!query.loading) {
        trackable = query.data.getTrackable
    }

    const enhancedUpdates = trackable.updates.edges?.map((u: TrackableUpdate) => {
        return {
            ...u,
            timestampDate: new Date(u.timestamp),
            image: u.metadata?.find((m) => m.key === "image")?.value,
        }
    })

    const sortedUpdates = enhancedUpdates?.sort((a, b) => b.timestampDate.getTime() - a.timestampDate.getTime())
    const firstUpdate = sortedUpdates && sortedUpdates[0]
    const restUpdates = sortedUpdates?.slice(1)

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column" align="center">
                <Stack spacing={5}>
                    <Text>Donation Status for {trackableId}</Text>
                    { query.loading && <Spinner />}
                    <Flex>
                        {
                            trackable.image && trackable.image.length > 0 &&
                            <Image src={getUrl(trackable.image!)} size="150px" rounded="lg" />
                        }
                        {
                            firstUpdate &&
                            <Flex alignItems="center">
                                <Text ml={4}>Donated: {firstUpdate.timestampDate.toLocaleDateString()}</Text>
                            </Flex>
                        }
                    </Flex>
                    {
                        restUpdates && restUpdates.map((u) => {
                            return (
                                <Flex>
                                    { 
                                        u.image && u.image.length > 0 &&
                                        <Image src={getUrl(u.image)} size="150px" rounded="lg" />
                                    }
                                    <Flex alignItems="center">
                                        <Text ml={4}>
                                            {u.message}: {u.timestampDate.toLocaleDateString()}
                                        </Text>
                                    </Flex>
                                </Flex>
                            )
                        })
                    }
                </Stack>
            </Flex>
        </Box>
    )
}
