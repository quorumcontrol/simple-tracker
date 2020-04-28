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
      <Flex mt={5} p={10} flexDirection="column" align="center">
        <RouterLink to="/donate">
          <Button>Make a Donation</Button>
        </RouterLink>
        <Stack mt={5} spacing={3} align="center" width="50%">
          <Text>
            Thank you so much for giving!
          </Text>
          <Text>
            Your donations will help feed the hungry.<br />
            There can be no greater gift.
          </Text>
          <Text>
            Just snap a picture of your donation and tell us where you are
            leaving it and our volunteers will be there to pick it up and get
            it where it is needed.
          </Text>

          <Link href="https://www.netlify.com/" mt={10} isExternal>
            This site is powered by Netlify
          </Link>
        </Stack>
      </Flex>
    </Box> 
  )
}