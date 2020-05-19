import React from 'react'
import { Box, Flex, Image, Text } from '@chakra-ui/core'
import { Trackable, TrackableUpdate } from "../generated/graphql";
import { getUrl } from "../lib/skynet";

export type DisplayUpdate = TrackableUpdate & { timestampDate: Date, image: any }

export function DonationTime(trackable: Trackable, firstUpdate?: TrackableUpdate) {
    return (
        <Flex p={5} shadow="md" borderWidth="1px">
            {
                trackable.image &&
                <Image src={getUrl(trackable.image!)} size="150px" rounded="lg" />
            }
            {
                firstUpdate &&
                <Box p={4}>
                    <Text>{new Date(firstUpdate.timestamp).toLocaleString()}</Text>
                    <Text>Donated</Text>
                </Box>
            }
        </Flex>
    )
}
