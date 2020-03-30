import React, { useState } from 'react'
import { Box, Flex, Heading, Button, Collapse,FormControl, Input, FormErrorMessage,FormLabel, ListItem, List } from '@chakra-ui/core'
import Header from '../components/header'
import { useAmbientDatabase } from 'ambient-react'
import { TrackableAction, Trackable, TrackableReducer, TrackableUpdate, addUpdate } from '../store'
import { useParams } from 'react-router-dom'
import debug from 'debug'
import { useForm } from 'react-hook-form'

const log = debug("pages.object")

export function ObjectPage() {
    const { objectId } = useParams()
    const [dispatch, trackableState, db] = useAmbientDatabase<Trackable, TrackableAction>(objectId!, TrackableReducer)
    const [show, setShow] = useState(false)
    const [addLoading, setAddLoading] = useState(false)
    const { handleSubmit, errors, setError, register, formState } = useForm<TrackableUpdate>();

    const handleToggle = () => setShow(!show);

    log("trackableState: ", trackableState)

    const onSubmit = async (data:TrackableUpdate)=> {
        setAddLoading(true)
        addUpdate(dispatch, {message: data.message})
        setAddLoading(false)
        setShow(false)
    }

    let updates: ReturnType<typeof ListItem>[] = []

    if (trackableState && trackableState.updates) {
        updates = trackableState.updates.map((update)=> {
            return (
                <ListItem key={update.timestamp}>{update.message}</ListItem>
            )
        })
    }

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Heading>{trackableState?.name}</Heading>
                </Box>
                <Box mt={5}>
                    <Button isLoading={addLoading} onClick={handleToggle}>
                        Add Update
                    </Button>
                    <Collapse mt={4} isOpen={show}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <FormControl>
                                <FormLabel htmlFor="message">Message</FormLabel>
                                <Input
                                    name="message"
                                    placeholder="Message"
                                    ref={register()}
                                />
                                <FormErrorMessage>
                                    {errors.message && errors.message.message}
                                </FormErrorMessage>
                            </FormControl>
                            <Button type="submit" isLoading={addLoading}>Add</Button>
                        </form>
                   </Collapse>
                </Box>
                <Box>
                    <List>
                        {updates}
                    </List>
                </Box>
            </Flex>
        </Box>
    )
}