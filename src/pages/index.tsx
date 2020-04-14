import React, { useState } from 'react'
import { Box, Flex, Button, Image, Collapse, FormControl, FormLabel, Input, FormErrorMessage, Icon } from '@chakra-ui/core'
import Header from '../components/header'
import { useHistory } from 'react-router-dom';
import { useAmbientUser, useAmbientDatabase } from 'ambient-react';
import { TrackableCollection, TrackableCollectionUpdate, TrackableCollectionReducer, addTrackable, useTrackableCollection } from '../store';
import debug from 'debug'
import { useForm } from 'react-hook-form';
import { upload, getUrl } from '../lib/skynet';

const log = debug("pages.index")

type AddTrackableFormData = {
    name: string
    image: FileList
}

export function Index() {
    const { user } = useAmbientUser()
    const [dispatch, trackableState,] = useTrackableCollection(user!)
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

        await addTrackable(dispatch, user!, name, skylink)
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

    if (trackableState && trackableState.trackables) {
        trackables = Object.keys(trackableState.trackables).map((id) => {
            const trackable = trackableState.trackables[id]
            return (

                <Box p="5" ml="2" maxW="sm" borderWidth="1px" rounded="lg" overflow="hidden" key={id} onClick={() => { history.push(`/objects/${id}`) }}>
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
                        {trackable.id}
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
                        {trackables}
                    </Flex>
                </Box>
            </Flex>
        </Box>
    )
}