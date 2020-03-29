import React from 'react'
import { Box, Flex, Button, ListItem, List } from '@chakra-ui/core'
import Header from '../components/header'
import { Link as RouterLink } from 'react-router-dom';
import { useAmbientUser, useAmbientDatabase } from 'ambient-react';
import { TrackableCollection, TrackableCollectionUpdate, TrackableCollectionReducer, TrackableCollectionActions, addTrackable, TrackableAction, Trackable, TrackableReducer } from '../store';
import { Database } from 'ambient-stack';
import debug from 'debug'

const log = debug("pages.index")

export function Index() {

    const { user } = useAmbientUser()
    const [dispatch, trackableState, db] = useAmbientDatabase<TrackableCollection, TrackableCollectionUpdate>(user!.userName + "-trackables", TrackableCollectionReducer)

    const addNewTrackable = async () => {
        const trackable = addTrackable(dispatch, user!, "New Trackable")
        log("addNewTrackable: ", trackable)
        const db = new Database<Trackable, TrackableAction>(trackable.id, TrackableReducer)
        await db.create(user!.tree.key!, {
            writers: [user?.did!],
            initialState: trackable,
        })
    }

    let trackables: ReturnType<typeof ListItem>[] = []

    if (trackableState && trackableState.trackables) {
        trackables = Object.keys(trackableState.trackables).map((id) => {
            return (
                <ListItem key={id}>
                    <RouterLink to={`/objects/${id}`}>
                        {trackableState.trackables[id].name}
                    </RouterLink>
                </ListItem>
            )
        })
    }

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Button onClick={addNewTrackable}>Add Object</Button>
                </Box>
                <Box mt={10}>
                    <List>
                        {trackables}
                    </List>
                </Box>
            </Flex>
        </Box>
    )
}