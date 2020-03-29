import React from 'react'
import { Box, Flex } from '@chakra-ui/core'
import Header from '../components/header'
import { useAmbientDatabase } from 'ambient-react'
import { TrackableAction, Trackable, TrackableReducer } from '../store'
import { useParams } from 'react-router-dom'

export function ObjectPage() {
    const {objectId} = useParams()
    const [dispatch, trackableState, db] = useAmbientDatabase<Trackable, TrackableAction>(objectId!, TrackableReducer)

    return (
        <Box>
            <Header/>
            <Flex mt={5} p={10}>
                {trackableState?.name}
            </Flex>
        </Box>
    )
}