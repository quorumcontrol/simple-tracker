import React from 'react'
import { Box, Spinner, Text, Flex } from '@chakra-ui/core'
import Header from './header'

export function LoadingSpinner(message: string) {
    return (
        <Box>
            <Header />
            <Flex align="center" justify="center" h="100%">
                <Spinner />
                <Text ml="1rem">{message}</Text>
            </Flex>
        </Box>
    )
}

export default LoadingSpinner
