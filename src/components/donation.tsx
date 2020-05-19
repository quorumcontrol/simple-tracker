import React from 'react'
import { Box, Flex, Image, Text } from '@chakra-ui/core'
import { Trackable, TrackableUpdate } from "../generated/graphql";
import { getUrl } from "../lib/skynet";

export type DisplayUpdate = TrackableUpdate & { timestampDate: Date, image: any }

export function UpdateTime(trackable: Trackable, label: string, update?: TrackableUpdate) {
    return (
        <Flex p={5} shadow="md" borderWidth="1px">
            {
                trackable.image &&
                <Image src={getUrl(trackable.image!)} size="150px" rounded="lg" />
            }
            {
                update &&
                <Box p={4}>
                    <Text>{new Date(update.timestamp).toLocaleString()}</Text>
                    <Text>{label}</Text>
                </Box>
            }
        </Flex>
    )
}
