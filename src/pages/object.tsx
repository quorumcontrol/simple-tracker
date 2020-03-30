import React, { useState, useEffect } from 'react'
import { Box, Flex, Heading, Button, Collapse, FormControl, Input, FormErrorMessage, FormLabel, ListItem, List } from '@chakra-ui/core'
import Header from '../components/header'
import { useAmbientUser } from 'ambient-react'
import { Trackable, TrackableUpdate } from '../store'
import { useParams } from 'react-router-dom'
import debug from 'debug'
import { useForm } from 'react-hook-form'
import { getAppCommunity } from 'ambient-stack'
import { EcdsaKey, ChainTree, setDataTransaction } from 'tupelo-wasm-sdk'

const log = debug("pages.object")

const useTrackable = (did: string, key: EcdsaKey) => {
    const [tree, setTree] = useState<ChainTree | undefined>(undefined)
    const [trackable, setTrackable] = useState<Trackable>({name: "Loading", id: did, updates:[]})
    useEffect(() => {
        const initialize = async () => {
            const c = await getAppCommunity()
            const tip = await c.getTip(did)
            const tree = new ChainTree({
                key: key,
                store: c.blockservice,
                tip: tip,
            })
            let resp = await tree.resolveData("_tracker")
            setTrackable(resp.value)
            setTree(tree)
        }
        if (!tree && did && key) {
            initialize()
        }
    }, [did, tree, key])

    const addUpdate = async (update:TrackableUpdate)=> {
        update.timestamp = (new Date()).getTime()
        trackable.updates.push(update)
        setTrackable(trackable)

        const c = await getAppCommunity()
        return c.playTransactions(tree!, [setDataTransaction("_tracker", trackable)])
    }

    return { tree, trackable, addUpdate }
}

export function ObjectPage() {
    const { objectId } = useParams()
    const { user } = useAmbientUser()
    const {trackable,addUpdate} = useTrackable(objectId!, user?.tree.key!)

    const [show, setShow] = useState(false)
    const [addLoading, setAddLoading] = useState(false)
    const { handleSubmit, errors, reset, register } = useForm<TrackableUpdate>();

    const handleToggle = () => setShow(!show);
   

    const onSubmit = async (data: TrackableUpdate) => {
        setAddLoading(true)
        addUpdate({message: data.message})
        setShow(false)
        reset()
        setAddLoading(false)
    }

    let updates: ReturnType<typeof ListItem>[] = []

    if (trackable) {
        updates = trackable.updates.map((update) => {
            return (
                <ListItem key={update.timestamp}>
                    <Box borderWidth="1px" rounded="lg" p={10} mt={10}>
                        {update.message}
                    </Box>
                </ListItem>
            )
        })
    }
    

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Heading>{trackable?.name}</Heading>
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