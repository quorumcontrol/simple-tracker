import React, { useState } from 'react'
import { Box, Flex, Button, Image, Collapse, FormControl, FormLabel, Input, FormErrorMessage, Icon, Spinner, Text } from '@chakra-ui/core'
import Header from '../components/header'
import { useHistory } from 'react-router-dom';
import debug from 'debug'
import { Trackable } from '../generated/graphql'
import { useForm } from 'react-hook-form';
import { upload, getUrl } from '../lib/skynet';
import { gql, useQuery, useMutation } from '@apollo/client';

const log = debug("pages.trackable")

type AddTrackableFormData = {
    name: string
    image: FileList
}

const CREATE_TRACKABLE = gql`
    mutation CreateTrackable($input: CreateTrackableInput!) {
        createTrackable(input: $input) {
            collection {
                did
            }
            trackable {
                did
                name
                image
            }
        }
    }
`

const GET_TRACKABLES = gql`
    {
        me {
            did
            collection {
               did
               trackables {
                   did
                   name
                   image
               }
            }
        }
    }
`

export function TrackablePage() {
    const query = useQuery(GET_TRACKABLES)
    const [createTrackable] = useMutation(CREATE_TRACKABLE)

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
            const resp = await upload(image.item(0)!, {});
            log("skylink: ", resp.skylink)
            skylink = resp.skylink
        }

        await createTrackable({
            variables: { input: { name } },
            optimisticResponse: {
                __typename: "Mutation",
                createTrackable: {
                    collection: {
                        __typename: "TrackableCollection",
                        did: query.data.me.collection.did,
                    },
                    trackable: {
                        __typename: "Trackable",
                        did: "loading...",
                        name: name,
                        image: skylink || "",
                    }
                }
            },
            update: (proxy, { data: { createTrackable } }) => {
                const data: any = proxy.readQuery({ query: GET_TRACKABLES })
                log("update called: ", createTrackable, " readQuery: ", data)
                // data.me.collection.trackables.push(createTrackable.trackable)
                // TODO: this should be a deep merge
                proxy.writeQuery({
                    query: GET_TRACKABLES, data: {
                        ...data,
                        me: {
                            ...data.me,
                            collection: {
                                ...data.me.collection,
                                trackables: data.me.collection.trackables.concat([createTrackable.trackable])
                            }
                        }
                    }
                })
            }
        })
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
        const trackableState = query.data.me.collection.trackables
        trackables = trackableState.map((trackable: Trackable) => {
            return (

                <Box p="5" ml="2" maxW="sm" borderWidth="1px" rounded="lg" overflow="hidden" key={trackable.did} onClick={() => { history.push(`/objects/${trackable.did}`) }}>
                    {trackable.image &&
                        <Image src={getUrl(trackable.image)} />
                    }
                    <Box
                        mt="1"
                        fontWeight="semibold"
                        as="h4"
                        lineHeight="tight"
                        isTruncated
                    >
                        {trackable.name}
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
                    {!show &&
                        <Button isLoading={addLoading} onClick={handleToggle}>
                            Add Object
                    </Button>}
                    <Collapse mt={4} isOpen={show}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <FormControl>
                                <FormLabel htmlFor="name">Name</FormLabel>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Trackable Name"
                                    ref={register({ required: "Name is required" })}
                                />
                                <FormErrorMessage>
                                    {errors.name && (errors.name.message)}
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
                            <Flex>
                                <Button type="submit" isLoading={addLoading}>Save</Button>
                                <Text ml={4} onClick={handleToggle}>cancel</Text>
                            </Flex>

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
