import React from 'react'
import { ApolloError } from '@apollo/client'
import { Box, Text } from '@chakra-ui/core'

export function ShowError(error: ApolloError) {
    console.error(error)
    return (
        <Box>
            <Text>{error.message}:</Text>
            <code>{error.stack}</code>
        </Box>
    )
}

export default ShowError
