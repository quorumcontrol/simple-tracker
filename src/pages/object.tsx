import React from 'react'
import { Box, Flex } from '@chakra-ui/core'
import Header from '../components/header'

export function ObjectPage() {
    return (
        <Box>
            <Header/>
            <Flex mt={5} p={10}>
                Object
            </Flex>
        </Box>
    )
}