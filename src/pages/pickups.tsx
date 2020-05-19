import React, { useState } from 'react'
import { gql, useQuery, useMutation } from '@apollo/client'
import { Box, Heading, Image, Text, Flex, Button, Icon } from '@chakra-ui/core'
import LoadingSpinner from '../components/loading'
import ShowError from '../components/errors'
import { Trackable, User, TrackableStatus, Recipient } from '../generated/graphql'
import { getUrl } from '../lib/skynet'
import { useHistory } from "react-router-dom";
import Header from '../components/header'
import { SUMMARY_PAGE_QUERY } from './summary'
import debug from 'debug'
import AddressComponent from '../components/address'

const log = debug("pages.pickups")

const PICKUPS_PAGE_QUERY = gql`
    {
        me {
            did
        }
        getTrackables {
            did
            trackables {
                did
                image
                status
                metadata {
                    key
                    value
                }
            }
        }
        getFirstRecipient {
            did
            name
            address
            instructions
        }
    }
`

const ACCEPT_JOB_MUTATION = gql`
    mutation PickUpsPageAccept($input: AcceptJobInput!) {
        acceptJob(input: $input) {
            code
        }
    }
`

export function PickUpsPage() {
    const { data, loading, error } = useQuery(PICKUPS_PAGE_QUERY)

    if (loading) {
        return LoadingSpinner("Loading pickups")
    }

    if (error) {
        return ShowError(error)
    }


    log("pickups page data: ", data)

    if (data.getTrackables?.trackables?.length == 0) {
        return (<Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Box>
                        <Heading>No donations available for pickup.</Heading>
                    </Box>
                </Box>
            </Flex>
        </Box>)
    }

    if (!data.getFirstRecipient) {
        return (<Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Box>
                        <Heading>No donation recipients available.</Heading>
                    </Box>
                </Box>
            </Flex>
        </Box>)
    }

    const available = data.getTrackables.trackables.filter((trackable: Trackable) => {
        return trackable.status == TrackableStatus.Published
    })

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Box>
                        <TrackableCollection trackables={available} user={data.me} recipient={data.getFirstRecipient} />
                    </Box>
                </Box>
            </Flex>
        </Box>
    )
}

function AcceptJobButton({ trackable, user }: { trackable: Trackable, user: User }) {
    const [acceptJob] = useMutation(ACCEPT_JOB_MUTATION)
    const history = useHistory()
    const [loading, setLoading] = useState(false)

    const onClick = async () => {
        setLoading(true)
        await acceptJob({
            variables: {
                input: {
                    trackable: trackable.did,
                    user: user.did,
                }
            },
            refetchQueries: [{ query: PICKUPS_PAGE_QUERY }, { query: SUMMARY_PAGE_QUERY }]
        })
        history.push('/summary')
    }

    return (
        <Button isLoading={loading} onClick={onClick}>Accept Job</Button>
    )
}

function TrackableCollection({ trackables, user, recipient }: { trackables: Trackable[], user: User, recipient: Recipient }) {


    const trackableElements = trackables.map((trackable: Trackable) => {
        const pickupAddr = trackable.metadata?.find((m) => m.key === "location")?.value
        log("pickupAddr: ", pickupAddr)
        return (
            <Box p="5" ml="2" maxW="sm" borderWidth="1px" rounded="lg" overflow="hidden" key={trackable.did}>
                {trackable.image &&
                    <Image src={getUrl(trackable.image)} />
                }
                <AddressComponent addr={pickupAddr} />
                <Text>{recipient.address}</Text>
                <Text>{recipient.instructions}</Text>
                {AcceptJobButton({ trackable, user })}
            </Box>
        )
    })
    return (
        <>
            {trackableElements}
        </>
    )
}
