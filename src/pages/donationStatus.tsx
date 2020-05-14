import debug from "debug";
import React from "react";
import { Box, Flex, Text, Image, Stack, Spinner } from "@chakra-ui/core";
import Header from "../components/header";
import { DisplayUpdate, DonationTime } from "../components/donation";
import { useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { Trackable, TrackableUpdate } from "../generated/graphql";
import { getUrl } from "../lib/skynet";

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

    const query = useQuery(GET_TRACKABLE, { variables: { did: trackableId! } })
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

    log('enhancedUpdates: ', enhancedUpdates)

    const sortedUpdates = enhancedUpdates?.sort((a, b) => a.timestampDate.getTime() - b.timestampDate.getTime())
    const firstUpdate = sortedUpdates && sortedUpdates[0]
    const restUpdates = sortedUpdates?.slice(1)

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column" align="center">
                <Stack spacing={5}>
                    <Text>Donation Status for</Text>
                    <Text fontSize="xs">{trackableId}</Text>
                    {query.loading && <Spinner />}
                    {DonationTime(trackable, firstUpdate)}
                    {
                        restUpdates && restUpdates.map((u) => {
                            return (
                                <Flex key={u.did} p={5} shadow="md" borderWidth="1px">
                                    {
                                        u.image &&
                                        <Image fallbackSrc="https://via.placeholder.com/150" src={getUrl(u.image)} size="150px" rounded="lg" />
                                    }
                                    <Box p={4}>
                                        <Text>
                                            {u.timestampDate.toLocaleString()}
                                        </Text>
                                        <Text>
                                            {u.message}
                                        </Text>
                                    </Box>
                                </Flex>
                            )
                        })
                    }
                </Stack>
            </Flex>
        </Box>
    )
}
