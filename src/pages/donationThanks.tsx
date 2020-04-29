import debug from "debug";
import React from "react";
import { Box, Flex, Text, Stack, Button } from "@chakra-ui/core";
import Header from "../components/header";
import { Link as RouterLink, useParams } from "react-router-dom";

const log = debug("pages.donationThanks")

export function DonationThanksPage() {
  const { trackableId } = useParams()

  return (
    <Box>
      <Header />
      <Flex mt={5} p={10} flexDirection="column" align="center">
        <Stack mt={10} spacing={3}>
          <Text>Thank you!</Text>
          <Text>A volunteer is on the way.</Text>
          <Text>
            {
              // TODO: Make "here" link more identifiable; maybe just underline "here"
            }
            You can check back <RouterLink to={`/donation/${trackableId}`}>here</RouterLink> to follow your donation on its way to those who need it.
          </Text>
          <RouterLink to="/donate">
            <Button mt={10}>Make Another Donation</Button>
          </RouterLink>
        </Stack>
      </Flex>
    </Box>
  )
}