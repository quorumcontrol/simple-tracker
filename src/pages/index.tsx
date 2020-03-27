import React from 'react'
import { Box, Flex, Button } from '@chakra-ui/core'
import Header from '../components/header'
import { Link as RouterLink} from 'react-router-dom';

export function Index() {
    return (
        <Box>
            <Header/>
            <Flex mt={5} p={10}>
                <RouterLink to="/objects/new">
                    <Button>Add Object</Button>
                </RouterLink>
            </Flex>
        </Box>
    )
}