import debug from 'debug';
import React from 'react';
import { Box, Flex, Text, Stack, Button, Link } from '@chakra-ui/core';
import Header from '../components/header';
import { Link as RouterLink } from 'react-router-dom';

const log = debug("pages.index")

export function Index() {
    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column" align="center" >
                <RouterLink to="/donate">
                    <Button variantColor="teal" size="lg">Make a Donation</Button>
                </RouterLink>
                <Stack mt={5} spacing={3} align="center" width="66%">
                    <Text>
                        To donate, just click the button above, enter donation information 
                        and then submit it for pick up (don't forget to snap a picture!)
                    </Text>
                    <Text>
                        Once submitted, your donation will be picked up and brought to one of 
                        our Food Banks. 
                    </Text>
                    <Text fontSize="sm" color="gray.500" mt={10}>
                        <Link href="https://tupelo.org/" mt={5} isExternal>
                            This site is built on the Tupelo DLT
                        </Link>
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                        <Link href="https://www.netlify.com/" mt={5} isExternal>
                            This site is powered by Netlify
                        </Link>
                    </Text>
                </Stack>
            </Flex>
        </Box>
    )
}
