import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Box, Flex, Button, Input, Icon, Spinner } from "@chakra-ui/core";
import Resizer from 'react-image-file-resizer';
import { upload } from "../lib/skynet";
import debug from "debug";

const log = debug("components.pictureForm")

export type ImageState = {
    data: [Blob, Dispatch<SetStateAction<Blob>>],
    url: [string, Dispatch<SetStateAction<string>>],
    uploading: [boolean, Dispatch<SetStateAction<boolean>>]
}

export function PictureButton({ formRegister, imageState, buttonText }: { formRegister: Function, imageState: ImageState, buttonText: string }) {
    const [image, setImage] = imageState.data
    const [imageURL, setImageURL] = imageState.url
    const [imageUploading, setImageUploading] = imageState.uploading

    let imageFileField: HTMLInputElement
    const imageRefHandler = (el: HTMLInputElement) => {
        formRegister()(el)
        imageFileField = el
    }

    const handleAddedImage = () => {
        if (imageFileField.files?.length === 0) {
            return
        }

        log("resizing and compressing image")
        Resizer.imageFileResizer(
            imageFileField.files?.item(0)!,
            300,
            300,
            "JPEG",
            90,
            0,
            (resized: Blob) => { setImage(resized) },
            'blob'
        )
        log("image resize and compression complete")
    }

    useEffect(() => {
        const uploadToSkynet = async (file: Blob) => {
            setImageUploading(true)
            log("uploading image to Skynet")
            const { skylink } = await upload(file, {})
            log("upload complete")
            setImageURL(skylink)
            setImageUploading(false)
        }

        if (image.size > 0) {
            uploadToSkynet(image)
        }
    }, [image])

    return (
        <div>
            {
                image.size === 0 ?
                    <Button width="225px" leftIcon="attachment" onClick={() => imageFileField.click()}>{buttonText}</Button>
                    :
                    (imageUploading ?
                        <Flex><Spinner mr={5} /> Picture uploading</Flex>
                        :
                        <Box display="inline-flex"><Icon color="green" name="check" mr={5} /> Picture attached</Box>
                    )
            }
            <Input
                hidden
                id="imageFileField"
                name="image"
                type="file"
                ref={imageRefHandler}
                onChange={handleAddedImage}
            />
        </div>
    )
}
