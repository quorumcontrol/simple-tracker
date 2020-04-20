import React, { useState } from 'react'
import { Box, Flex, Button, Image, Collapse, FormControl, FormLabel, Input, FormErrorMessage, Icon, Spinner } from '@chakra-ui/core'
import Header from '../components/header'
import { useHistory } from 'react-router-dom';
import { useAmbientUser, useAmbientDatabase } from 'ambient-react';
import { TrackableCollection, TrackableCollectionUpdate, TrackableCollectionReducer, addTrackable, useTrackableCollection } from '../store';
import debug from 'debug'
import { Trackable, TrackableEdge } from '../generated/graphql'
import { useForm } from 'react-hook-form';
import { upload, getUrl } from '../lib/skynet';
import { gql, useQuery, useMutation } from '@apollo/client';
import { CREATE_TRACKABLE } from '../store/queries';

const log = debug("pages.index")

type AddTrackableFormData = {
    name: string
    image: FileList
}

const GET_TRACKABLES = gql`
    {
        me {
            did
            collection {
               did
               trackables {
                   edges {
                        did
                        node {
                            name
                            image
                        }
                   }
               }
            }
        }
    }
`

export function Index() {
    const { user } = useAmbientUser()
    // const [dispatch, trackableState,] = useTrackableCollection(user!)

    const query = useQuery(GET_TRACKABLES)
    const [createTrackable, result] = useMutation(CREATE_TRACKABLE)
    console.log("index query: ", query)

    const [addLoading, setAddLoading] = useState(false)
    const [show, setShow] = useState(false);
    const [imageAdded, setImageAdded] = useState(false)
    const history = useHistory()

    const { handleSubmit, errors, register, reset } = useForm<AddTrackableFormData>();

    const handleToggle = () => setShow(!show);

    const onSubmit = async ({ name, image }: AddTrackableFormData) => {
        setAddLoading(true)
        setShow(false)

        let skylink: string | undefined = undefined

        if (image && image.length > 0) {
            const resp = await upload(image, {});
            log("skylink: ", resp.skylink)
            skylink = resp.skylink
        }

        await createTrackable({variables: {input: {name}}})
        // await addTrackable(dispatch, user!, name, skylink)
        reset()
        setImageAdded(false)
        setAddLoading(false)
    }

    let imageFileField: HTMLInputElement

    const imageRefHandler = (el: HTMLInputElement) => {
        register()(el)
        imageFileField = el
    }

    const handleAddedImage = () => {
        setImageAdded(true)
    }

    let trackables: ReturnType<typeof Box>[] = []

    if (query.data && query.data.me.collection) {
        const trackableState = query.data.me.collection.trackables.edges
        trackables = trackableState.map((trackable:TrackableEdge) => {
            return (

                <Box p="5" ml="2" maxW="sm" borderWidth="1px" rounded="lg" overflow="hidden" key={trackable.did} onClick={() => { history.push(`/objects/${trackable.did}`) }}>
                    {trackable.node?.image &&
                        <Image src={getUrl(trackable.node.image)} />
                    }
                    <Box
                        mt="1"
                        fontWeight="semibold"
                        as="h4"
                        lineHeight="tight"
                        isTruncated
                    >
                        {trackable.node?.name}
                    </Box>
                    <Box mt="2" color="gray.600" fontSize="sm">
                        {trackable.did}
                    </Box>
                </Box>
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
                            <FormControl mb={10} mt={5}>
                                {
                                    imageAdded ?
                                        <Box display="inline-flex"><Icon color="green" name="check" mr={5} /> Image Added</Box>
                                        :
                                        <Button leftIcon="attachment" onClick={() => imageFileField.click()}>Add Image</Button>
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
                    </Collapse>
                </Box>
                <Box mt={10}>
                    <Flex>
                        {query.loading ? <Spinner /> : trackables}
                    </Flex>
                </Box>
            </Flex>
        </Box>
    )
}