import debug from "debug";
import React from "react";
import { Box, Flex, Text, Image, Stack, Spinner } from "@chakra-ui/core";
import Header from "../components/header";
import { DonationTime } from "../components/donation";
import { useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { Trackable } from "../generated/graphql";
import { sortUpdates } from "../store/trackables";
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

    const sortedUpdates = sortUpdates(trackable)
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
