import debug from "debug";
import React from "react";
import { Box, Flex, Text } from "@chakra-ui/core";
import Header from "../components/header";
import { useParams } from "react-router-dom";

const log = debug("pages.donationStatus")

export function DonationStatusPage() {
  const { trackableId } = useParams()

  return (
    <Box>
      <Header />
      <Flex mt={5} p={10} flexDirection="column" align="center">
        <Text>Donation Status for {trackableId}</Text>
        {
          // TODO: All of this
        }
      </Flex>
    </Box>
  )
}