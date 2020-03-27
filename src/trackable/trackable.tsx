import React from 'react'
import { Box, Flex } from '@chakra-ui/core'
import Header from '../header'

export function TrackablePage() {
    return (
        <Box>
            <Header/>
            <Flex mt={5} p={10}>
                Object
            </Flex>
        </Box>
    )
}