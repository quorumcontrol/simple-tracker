import React from 'react'
import { gql, useQuery } from '@apollo/client'
import { Box, Heading, Image, Icon, Text, Flex } from '@chakra-ui/core'
import LoadingSpinner from '../components/loading'
import ShowError from '../components/errors'
import { Trackable, User, TrackableStatus, Recipient } from '../generated/graphql'
import { Link } from 'react-router-dom';
import { getUrl } from '../lib/skynet'
import Header from '../components/header'
import debug from 'debug'
import AddressComponent from '../components/address';

const log = debug("pages.summary")

export const SUMMARY_PAGE_QUERY = gql`
    {
        me {
            did
        }
        getTrackables {
            did
            trackables {
                did
                status
                name
                image
                metadata {
                    key
                    value
                }
                driver {
                    did
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

export function SummaryPage() {
    const { data, loading, error } = useQuery(SUMMARY_PAGE_QUERY)
    if (loading) {
        return LoadingSpinner("Loading donations")
    }

    if (error) {
        return ShowError(error)
    }

    log("summary page data: ", data)

    if (data.getTrackables?.trackables?.length === 0) {
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

    let recipient: Recipient;

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
    } else {
        recipient = data.getFirstRecipient
    }

    const available = data.getTrackables.trackables.filter((trackable: Trackable) => {
        return trackable.status === TrackableStatus.Published
    })

    const myTrackables = data.getTrackables.trackables.filter((trackable: Trackable) => {
        return trackable.driver?.did === data.me.did && [TrackableStatus.Accepted, TrackableStatus.PickedUp].includes(trackable.status!)
    })

    log("myTrackables: ", myTrackables)

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Flex p="5" maxW="sm" borderWidth="1px" rounded="lg" alignItems="center">
                        <Link to="/pickups">Find more Deliveries <br /> ({available.length} Available)</Link>
                        <Icon ml="auto" name="chevron-right" />
                    </Flex>
                    <Box mt={5}>
                        <Heading mb={5} size="sm">Your current deliveries</Heading>
                        <TrackableCollection trackables={myTrackables} recipient={recipient} />
                    </Box>

                </Box>
            </Flex>
        </Box>
    )
}

function TrackableCollection({ trackables, recipient }: { trackables: Trackable[], recipient: Recipient }) {
    const trackableElements = trackables.map((trackable: Trackable) => {
        let link: string = ""
        switch (trackable.status) {
            case TrackableStatus.Accepted: {
                link = `/objects/${trackable.did}/pickup`
                break;
            }
            case TrackableStatus.PickedUp: {
                link = `/objects/${trackable.did}/dropoff`
                break;
            }
        }
        const pickupAddr = trackable.metadata?.find((m) => m.key === "location")?.value

        return (
            <Link to={link} key={trackable.did}>
                <Box p="5" mt={2} maxW="sm" borderWidth="1px" rounded="lg" overflow="hidden">
                    {trackable.image &&
                        <Image src={getUrl(trackable.image)} />
                    }
                    {trackable.status == TrackableStatus.PickedUp ?
                        <Text> <Icon name="check" /> Picked Up</Text>
                        :
                        <AddressComponent addr={pickupAddr} />
                    }
                    <AddressComponent addr={recipient.address} />
                    <Text>{recipient.instructions}</Text>
                </Box>
            </Link>
        )
    })
    return (
        <>
            {trackableElements}
        </>
    )
}
