import React, { useState, useEffect } from 'react'
import { Box, Flex, Heading, Button, Collapse, FormControl, Input, FormErrorMessage, FormLabel, ListItem, List, Image, Text, Icon } from '@chakra-ui/core'
import Header from '../components/header'
import { useAmbientUser } from 'ambient-react'
import { Trackable, TrackableUpdate } from '../store'
import { useParams } from 'react-router-dom'
import debug from 'debug'
import { useForm } from 'react-hook-form'
import { getAppCommunity } from 'ambient-stack'
import { EcdsaKey, ChainTree, setDataTransaction } from 'tupelo-wasm-sdk'
import parse from "url-parse";
import axios from "axios";
import moment from 'moment';

const log = debug("pages.object")

const PORTAL_URI = "https://siasky.net"

async function upload(portalUrl: string, fileList: FileList, options = {}) {
    const formData = new FormData();
    if (fileList.length === 0) {
        throw new Error("you must have a file to upload")
    }

    const file = fileList.item(0)?.slice()

    formData.append("file", file!);

    const parsed = parse(portalUrl);

    parsed.set("pathname", "/skynet/skyfile");

    const { data } = await axios.post(
        parsed.toString(),
        formData,
        //   options.onUploadProgress && {
        //     onUploadProgress: ({ loaded, total }) => {
        //       const progress = loaded / total;

        //       options.onUploadProgress(progress, { loaded, total });
        //     },
        //   }
    );

    return data;
}

function getUrl(portalUrl: string, skylink: string, options = {}) {
    const parsed = parse(portalUrl);

    parsed.set("pathname", skylink);

    // if (options.download) {
    //     parsed.set("query", { attachment: true });
    // }

    return parsed.toString();
}

type TrackableFormData = {
    message: string
    image: FileList
    location: Position
}

const useTrackable = (did: string, key: EcdsaKey) => {
    const [tree, setTree] = useState<ChainTree | undefined>(undefined)
    const [trackable, setTrackable] = useState<Trackable>({ name: "Loading", id: did, updates: [] })

    const {user} = useAmbientUser()

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

    const addUpdate = async (update: TrackableUpdate) => {
        update.timestamp = (new Date()).toISOString()
        update.userName = user?.userName
        update.user = user?.did

        trackable.updates.unshift(update)
        setTrackable(trackable)

        const c = await getAppCommunity()
        return c.playTransactions(tree!, [setDataTransaction("_tracker", trackable)])
    }

    return { tree, trackable, addUpdate }
}

export function ObjectPage() {
    const { objectId } = useParams()
    const { user } = useAmbientUser()
    const { trackable, addUpdate } = useTrackable(objectId!, user?.tree.key!)

    const [show, setShow] = useState(false)
    const [addLoading, setAddLoading] = useState(false)
    const { handleSubmit, errors, reset, register } = useForm<TrackableFormData>();

    const [location, setLocation] = useState<Position | undefined>(undefined)
    const [locationLoading, setLocationLoading] = useState(false)

    const [imageAdded, setImageAdded] = useState(false)

    const handleToggle = () => setShow(!show);

    const onSubmit = async (data: TrackableFormData) => {
        setAddLoading(true)
        console.log("data: ", data)
        let metadata: { [key: string]: any } = {}
        if (data.image && data.image.length > 0) {
            const { skylink } = await upload(PORTAL_URI, data.image, {});
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
                img = <Image src={getUrl(PORTAL_URI, update.metadata.image)} />
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
                        <Box p={5}>
                            {img}
                        </Box>
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
                <Box>
                    <List>
                        {updates}
                    </List>
                </Box>
            </Flex>
        </Box>
    )
}