import React, { useState } from 'react'
import { Box, Flex, Button, ListItem, List, Collapse, FormControl, FormLabel, Input, FormErrorMessage } from '@chakra-ui/core'
import Header from '../components/header'
import { Link as RouterLink } from 'react-router-dom';
import { useAmbientUser, useAmbientDatabase } from 'ambient-react';
import { TrackableCollection, TrackableCollectionUpdate, TrackableCollectionReducer, addTrackable } from '../store';
import debug from 'debug'
import { useForm } from 'react-hook-form';

const log = debug("pages.index")

type AddTrackableFormData = {
    name: string
}

export function Index() {
    const { user } = useAmbientUser()
    const [dispatch, trackableState,] = useAmbientDatabase<TrackableCollection, TrackableCollectionUpdate>(user!.userName + "-trackables", TrackableCollectionReducer)
    const [addLoading, setAddLoading] = useState(false)
    const [show, setShow] = useState(false);

    const { handleSubmit, errors, setError, register, formState } = useForm<AddTrackableFormData>();

    const handleToggle = () => setShow(!show);

    const onSubmit = async ({ name }: AddTrackableFormData) => {
        setAddLoading(true)
        setShow(false)
        await addTrackable(dispatch, user!, name)
        setAddLoading(false)
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
                    <Button isLoading={addLoading} onClick={handleToggle}>
                        Add Object
                    </Button>
                    <Collapse mt={4} isOpen={show}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <FormControl>
                                <FormLabel htmlFor="name">Name</FormLabel>
                                <Input
                                    name="name"
                                    placeholder="Trackable Name"
                                    ref={register({ required: "Name is required" })}
                                />
                                <FormErrorMessage>
                                    {errors.name && errors.name.message}
                                </FormErrorMessage>
                            </FormControl>

                            <Button type="submit" isLoading={addLoading}>Add</Button>
                        </form>
                    </Collapse>
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