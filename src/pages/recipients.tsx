import React, { useState } from 'react'
import { gql, useQuery } from '@apollo/client'
import { Box, Heading, Text, Flex, Button } from '@chakra-ui/core'
import ShowError from '../components/errors'
import LoadingSpinner from '../components/loading'
import { Recipient } from '../generated/graphql'
import Header from '../components/header'
import RecipientAddress from '../components/recipientAddress'

const GET_RECIPIENTS = gql`
    {
        getRecipients {
            did
            name
            address { street cityStateZip }
        }
    }
`

export function RecipientsPage() {
    const { data, loading, error } = useQuery(GET_RECIPIENTS)

    if (loading) {
        return LoadingSpinner("Loading recipients")
    }

    if (error) {
        return ShowError(error)
    }

    if (!(data && data.getRecipients && data.getRecipients?.length > 0)) {
        return (<Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Box>
                        <Heading>No Donation Recipients.</Heading>
                    </Box>
                </Box>
            </Flex>
        </Box>)
    }


    const recipients = data.getRecipients
    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Box>
                        <RecipientCollection recipients={recipients} />
                    </Box>
                </Box>
            </Flex>
        </Box>
    )
}

function RecipientCollection({ recipients }: { recipients: Recipient[] }) {

    const recipientElements = recipients.map((recipient: Recipient) => {
        console.log("looking at recipient: ", recipient)
        return (
            <Box p="5" ml="2" maxW="sm" borderWidth="1px" rounded="lg" overflow="hidden" key={recipient.did}>
                <Text>{recipient.name} </Text>
                <RecipientAddress addr={recipient.address!} />
            </Box>
        )
    })
    return (
        <>
            {recipientElements}
        </>
    )
}
