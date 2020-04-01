import React, { useState, useEffect } from 'react'
import { Box, Flex, Heading, Button, Collapse, FormControl, Input, FormErrorMessage, FormLabel, ListItem, List, Image, Text, Icon } from '@chakra-ui/core'
import Header from '../components/header'
import { useAmbientUser } from 'ambient-react'
import { Trackable, TrackableUpdate, CollaboratorList, userNamespace, useTrackableCollection, addExistingTrackable } from '../store'
import { useParams } from 'react-router-dom'
import debug from 'debug'
import { useForm } from 'react-hook-form'
import { getAppCommunity, User } from 'ambient-stack'
import { EcdsaKey, ChainTree, setDataTransaction, setOwnershipTransaction } from 'tupelo-wasm-sdk'
import moment from 'moment';    
import {upload,getUrl} from '../lib/skynet'
import { QRCode } from 'react-qrcode-logo';

const log = debug("pages.object")

type TrackableFormData = {
    message: string
    image: FileList
    location: Position
}

const useTrackable = (did: string, key: EcdsaKey) => {
    const [tree, setTree] = useState<ChainTree | undefined>(undefined)
    const [trackable, setTrackable] = useState<Trackable>({ name: "Loading", id: did, updates: [] })
    const [collaborators, setCollaborators] = useState<CollaboratorList>([])
    const { user } = useAmbientUser()

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
            let collaboratorResp = await tree.resolveData("_trackerCollaborators")
            setCollaborators(collaboratorResp.value)
        }
        if (!tree && did && key) {
            initialize()
        }
    }, [did, tree, key])

    const addUpdate = async (update: TrackableUpdate) => {
        update.timestamp = (new Date()).toISOString()
        update.userName = user?.userName
        update.user = user?.did

        trackable.updates.unshift(update)
        setTrackable(trackable)

        const c = await getAppCommunity()
        return c.playTransactions(tree!, [setDataTransaction("_tracker", trackable)])
    }

    const authPath = "tree/_tupelo/authentications"

    const addCollaborator = async (username:string) => {
        const c = await getAppCommunity()

        const user = await User.find(username, Buffer.from(userNamespace), c)
        if (user) {
            await user.load()
            collaborators.push({name: user.userName, did: user.did!})
            setCollaborators(collaborators)
            const userAuthResp = await user.tree.resolve(authPath)
            const currAuthResp = await tree?.resolve(authPath)
            const newAuths = currAuthResp?.value.concat(userAuthResp.value)
            await c.playTransactions(tree!, [
                setDataTransaction("_trackerCollaborators", collaborators),
                setOwnershipTransaction(newAuths),
            ])
            return
        }
    }

    return { tree, trackable, addUpdate, collaborators, addCollaborator }
}

function geoPositonToPojo(coords: Coordinates): Coordinates {
    const keys = ["latitude",
        "longitude",
        "altitude",
        "accuracy",
        "altitudeAccuracy",
        "heading",
        "speed",]
    let retCoord: any = {}
    keys.forEach((key) => {
        retCoord[key] = Reflect.get(coords, key)
    })
    return retCoord
}

type CollaboratorFormData = {
    name:string
}

export function CollaboratorUI({collaborators, addCollaborator}:{collaborators:CollaboratorList, addCollaborator:(username:string)=>Promise<void>}) {
    const [show, setShow] = useState(false)
    const [addLoading, setAddLoading] = useState(false)
    const { handleSubmit, errors, reset, register } = useForm<CollaboratorFormData>();

    const handleToggle = () => setShow(!show);

    const onSubmit = async (data:CollaboratorFormData)=> {
        setAddLoading(true)
        setShow(!show)
        await addCollaborator(data.name)
        reset()
        setAddLoading(false)
    }


    let collaboratorItems: ReturnType<typeof ListItem>[] = []
    if (collaborators) {
        collaboratorItems = collaborators.map((collaborator)=> {
            return <ListItem key={collaborator.did}><Icon name="at-sign"/> {collaborator.name}</ListItem>
        })
    }

    return (
        <>
            <Heading size="md">Owners</Heading>
            <List>
                {collaboratorItems}
            </List>
            <Box mt={5}>
                    <Button isLoading={addLoading} onClick={handleToggle}>
                        Add Owner
                    </Button>
                    <Collapse mt={4} isOpen={show}>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <FormControl>
                                    <FormLabel htmlFor="name">Name</FormLabel>
                                    <Input
                                        name="name"
                                        placeholder="Name"
                                        ref={register({required: "Name is required"})}
                                    />
                                    <FormErrorMessage>
                                        {errors.name && errors.name.message}
                                    </FormErrorMessage>
                                </FormControl>
                                <Button type="submit" isLoading={addLoading}>Add</Button>
                            </form>
                    </Collapse>
            </Box>
        </>
    )
}

export function ObjectPage() {
    const { objectId } = useParams()
    const { user } = useAmbientUser()
    const [dispatch, userCollection] = useTrackableCollection(user!)
    const { trackable, addUpdate, collaborators,addCollaborator } = useTrackable(objectId!, user?.tree.key!)

    const [show, setShow] = useState(false)
    const [addLoading, setAddLoading] = useState(false)
    const { handleSubmit, errors, reset, register } = useForm<TrackableFormData>();

    const [location, setLocation] = useState<Position | undefined>(undefined)
    const [locationLoading, setLocationLoading] = useState(false)

    const [imageAdded, setImageAdded] = useState(false)

    useEffect(()=> {
        if (trackable && userCollection) {
            if (!userCollection.trackables[trackable.id]) {
                console.log("add existing")
                addExistingTrackable(dispatch, trackable)
            }
        }
    }, [trackable, userCollection, dispatch])

    const handleToggle = () => setShow(!show);

    const onSubmit = async (data: TrackableFormData) => {
        setAddLoading(true)
        let metadata: { [key: string]: any } = {}
        if (location) {
            metadata.location = geoPositonToPojo(location.coords)
        }
        if (data.image && data.image.length > 0) {
            const { skylink } = await upload(data.image, {});
            log("skylink: ", skylink)
            metadata['image'] = skylink
        }
        addUpdate({ message: data.message, metadata: metadata })
        setShow(false)
        reset()
        setAddLoading(false)
    }

    let updates: ReturnType<typeof ListItem>[] = []

    if (trackable) {
        updates = trackable.updates.map((update) => {
            log("update: ", update)
            let img: ReturnType<typeof Image> = null
            if (update.metadata && update.metadata.image) {
                img = <Image src={getUrl(update.metadata.image)} />
            }

            return (
                <ListItem key={update.timestamp}>
                    <Box borderWidth="1px" rounded="lg" p={2} mt={10}>
                        <Box>
                            <Text fontSize="sm">{update.userName} added {moment(update.timestamp).fromNow()}</Text>
                        </Box>
                        <Box p={5}>
                            <Text>{update.message}</Text>
                        </Box>
                        {update.metadata && update.metadata.location && <Box p={5}>
                            <Text>{update.metadata.location.latitude},{update.metadata.location.longitude}</Text>
                        </Box>}
                        {img && <Box p={5}>
                            {img}
                        </Box>}
                    </Box>
                </ListItem>
            )
        })
    }

    const addPosition = async () => {
        setLocationLoading(true)
        const position = await new Promise<Position>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
        })
        setLocation(position)
    }

    let imageFileField: HTMLInputElement

    const imageRefHandler = (el: HTMLInputElement) => {
        register()(el)
        imageFileField = el
    }

    const handleAddedImage = () => {
        setImageAdded(true)
    }

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                {trackable.image &&
                    <Box>
                        <Image src={getUrl(trackable.image)} />
                    </Box>
                }
                <Box>
                    <Heading>{trackable?.name}</Heading>
                </Box>
                <Box mt={5}>
                    <Button isLoading={addLoading} onClick={handleToggle}>
                        Add Update
                    </Button>
                    <Collapse mt={4} isOpen={show}>
                        <Box borderWidth="1px" rounded="sm" p={4}>
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
                                <FormControl mb={10} mt={5}>
                                    {
                                        imageAdded ?
                                            <Box display="inline-flex"><Icon color="green" name="check" mr={5} /> Image Added</Box>
                                            :
                                            <Button leftIcon="attachment" onClick={() => imageFileField.click()}>Add Image</Button>
                                    }
                                    {location ?
                                        <Box display="inline-flex" ml={5}><Text fontSize="sm">Location: {location.coords.latitude},{location.coords.longitude}</Text></Box>
                                        :
                                        <Button ml={5} isLoading={locationLoading} onClick={addPosition}>Add Location</Button>
                                    }
                                    <Input
                                        hidden
                                        id="imageField"
                                        name="image"
                                        type="file"
                                        ref={imageRefHandler}
                                        onChange={handleAddedImage}
                                    />
                                    <FormErrorMessage>
                                        {errors.image && "There was a problem with your upload"}
                                    </FormErrorMessage>
                                </FormControl>
                                <Button type="submit" isLoading={addLoading}>Add</Button>
                            </form>
                        </Box>
                    </Collapse>
                </Box>
                <Flex>
                    <Box flexGrow={2}>
                        <List>
                            {updates}
                        </List>
                    </Box>
                    <Box borderWidth="1px" p={10} rounded="sm" ml={5}>
                        <CollaboratorUI collaborators={collaborators} addCollaborator={addCollaborator} />
                    </Box>
                </Flex>
                <Box mt={10}>
                    <QRCode value={window.location.href} />
                </Box>
            </Flex>
        </Box>
    )
}