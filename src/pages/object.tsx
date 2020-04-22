import React, { useState } from 'react'
import { Box, Flex, Heading, Button, Collapse, FormControl, Input, FormErrorMessage, FormLabel, ListItem, List, Image, Text, Icon } from '@chakra-ui/core'
import Header from '../components/header'
import { useParams } from 'react-router-dom'
import debug from 'debug'
import { useForm } from 'react-hook-form'
import moment from 'moment';
import { upload, getUrl } from '../lib/skynet'
import { QRCode } from 'react-qrcode-logo';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet'
import { LatLngTuple } from 'leaflet'
import { gql, useQuery, useMutation } from '@apollo/client'
import {Trackable, TrackableUpdate, MetadataEntry, Scalars, User} from '../generated/graphql'

const log = debug("pages.object")

type TrackableFormData = {
    message: string
    image: FileList
    location: Position
}

const GET_COLLABORATORS=gql`
    query GetCollaborators($did: ID!) {
        getTrackable(did: $did) {
            did
            collaborators {
                edges {
                    did
                    username
                }
            }
        }
    }
`

const GET_TRACKABLE=gql`
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

const ADD_COLLABORATOR = gql`
    mutation AddCollaborator($input: AddCollaboratorInput!) {
        addCollaborator(input: $input) {
            code
            collaborator {
                did
                username
            }
        }
    }
`

const ADD_UPDATE = gql`
    mutation UpdateTrackable($input: AddUpdateInput!) {
        addUpdate(input: $input) {
            update {
                did
                message
                metadata
            }
        }
    }
`

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
    name: string
}

export function CollaboratorUI({did}:{did: Scalars['ID']}) {
    const [show, setShow] = useState(false)
    const [addLoading, setAddLoading] = useState(false)
    const { handleSubmit, errors, reset, register } = useForm<CollaboratorFormData>();
    const query = useQuery(GET_COLLABORATORS, {variables: {did: did}})
    log("getcollaborator results: ", query)

    let collaborators:User[] = []
    if (!query.loading && !query.error) {
        collaborators = query.data.getTrackable.collaborators.edges
    }
    const [addCollaborator] = useMutation(ADD_COLLABORATOR)

    const handleToggle = () => setShow(!show);

    const onSubmit = async (data: CollaboratorFormData) => {
        setAddLoading(true)
        setShow(!show)
        await addCollaborator({
            variables: {input: {username: data.name, trackable: did}},
            optimisticResponse: {
                __typename: "Mutation",
                addCollaborator: {
                    collaborator: {
                        __typename: "User",
                        did: "loading",
                        username: data.name,
                    }
                }
            },
            update: (proxy, {data: {addCollaborator}})=> {
                const data:any = proxy.readQuery({query: GET_COLLABORATORS, variables: {did: did}})
                console.log("update called: ", addCollaborator, " readQuery: ", data)
                // data.me.collection.trackables.push(createTrackable.trackable)
                // TODO: this should be a deep merge
                proxy.writeQuery({
                    query: GET_COLLABORATORS, 
                    variables: {did: did},
                    data: {
                        ...data,
                        getTrackable: {
                            ...data.getTrackable,
                            collaborators: {
                                ...data.getTrackable.collaborators,
                                edges: query.data.getTrackable.collaborators.edges.concat([addCollaborator.collaborator]),
                            }
                        }
                    }
                })
            }
        })
        reset()
        setAddLoading(false)
    }


    let collaboratorItems: ReturnType<typeof ListItem>[] = []
    collaboratorItems = collaborators.map((collaborator) => {
        return <ListItem key={collaborator.did}><Icon name="at-sign" /> {collaborator.username}</ListItem>
    })

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
        </>
    )
}

export function LocationWidget({ latitude, longitude }: { latitude: number, longitude: number }) {
    const [show, setShow] = useState(false)
    const handleToggle = () => setShow(!show);

    const position:LatLngTuple = [latitude, longitude]

    return (
        <Box p={5}>
            <Text onClick={handleToggle}>{latitude},{longitude}</Text>
            <Collapse mt={4} isOpen={show}>
                    <Map center={position} zoom={12} style={{height: "300px", width: "300px"}}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                        />
                        <Marker position={position}>
                            <Popup>A pretty CSS3 popup.<br />Easily customizable.</Popup>
                        </Marker>
                    </Map> 
            </Collapse>
        </Box>
    )
}

function ObjectUpdate({ update }: { update: TrackableUpdate }) {
    let img: ReturnType<typeof Image> = null

    let metadata:{[key:string]:any} = {}
    if (update.metadata) {
        update.metadata.forEach(({key,value}, _i)=> {
            metadata[key] = value
        })
    }
    console.log("metadata: ", metadata)

    if (metadata.image) {
        img = <Image src={getUrl(metadata.image)} />
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
                {metadata.location &&
                    <LocationWidget longitude={metadata.location.longitude} latitude={metadata.location.latitude} />}
                {img && <Box p={5}>
                    {img}
                </Box>}
            </Box>
        </ListItem>
    )
}

export function ObjectPage() {
    const { objectId } = useParams()

    const query = useQuery(GET_TRACKABLE, {variables: {did: objectId!}})
    log("object page query: ", query)
    let trackable:Trackable = { name: "Loading", did: objectId!, image: "", updates: {} }
    if (query.error) {
        throw query.error
    }
    if (!query.loading) {
        trackable = query.data.getTrackable
    }

    const [addUpdate,result] = useMutation(ADD_UPDATE)
    log("mutation result: ", result)

    const [show, setShow] = useState(false)
    const [addLoading, setAddLoading] = useState(false)
    const { handleSubmit, errors, reset, register } = useForm<TrackableFormData>();

    const [location, setLocation] = useState<Position | undefined>(undefined)
    const [locationLoading, setLocationLoading] = useState(false)

    const [imageAdded, setImageAdded] = useState(false)

    const handleToggle = () => setShow(!show);

    const onSubmit = async (data: TrackableFormData) => {
        setAddLoading(true)
        let metadata:MetadataEntry[] = []
        if (location) {
            metadata.push({key: "location", value: geoPositonToPojo(location.coords)})
        }
        if (data.image && data.image.length > 0) {
            const { skylink } = await upload(data.image, {});
            metadata.push({key: "image", value: skylink})
        }
        setShow(false)
        reset()
        await addUpdate({
            variables: {input: {trackable: objectId, message: data.message, metadata: metadata}},
            optimisticResponse: {
                __typename: "Mutation",
                addUpdate: {
                    update: {
                        __typename: "TrackableUpdate",
                        did: "did/update/loading",
                        timestamp: (new Date()).toISOString(),
                        message: data.message,
                        metadata: metadata,
                        userName: "you",
                        userDid: "loading...",
                    }
                }
            },
            update: (proxy, {data: {addUpdate}})=> {
                const data:any = proxy.readQuery({query: GET_TRACKABLE, variables: {did: objectId}})
                console.log("update called: ", addUpdate, " readQuery: ", data)
                // data.me.collection.trackables.push(createTrackable.trackable)
                // TODO: this should be a deep merge
                proxy.writeQuery({
                    query: GET_TRACKABLE, 
                    variables: {did: objectId},
                    data: {
                        ...data,
                        getTrackable: {
                            ...data.getTrackable,
                            updates: {
                                ...data.getTrackable.updates,
                                edges: query.data.getTrackable.updates.edges.concat([addUpdate.update]),
                            }
                        }
                    }
                })
            }
        })
        setAddLoading(false)
    }

    let updates: ReturnType<typeof ListItem>[] = []

    if (trackable && trackable.updates.edges) {
        updates = trackable.updates.edges.map((update) => {
            return (
                <ObjectUpdate key={update.timestamp} update={update} />
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
                        <CollaboratorUI did={objectId!} />
                    </Box>
                </Flex>
                <Box mt={10}>
                    <QRCode value={window.location.href} />
                </Box>
            </Flex>
        </Box>
    )
}