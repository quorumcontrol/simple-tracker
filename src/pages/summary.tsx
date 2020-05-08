import React from 'react'
import { gql, useQuery } from '@apollo/client'
import { Box, Spinner, Heading, Image, Icon, Text, Flex } from '@chakra-ui/core'
import { Trackable, User, TrackableStatus } from '../generated/graphql'
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
    }
`

export function SummaryPage() {
    const { data, loading, error } = useQuery(SUMMARY_PAGE_QUERY)
    if (loading) {
        return (
            <Box>
                <Header />
                <Flex align="center" justify="center" h="100%">
                    <Spinner />
                    <Text ml="1rem">Loading donations</Text>
                </Flex>
            </Box>
        )
    }

    if (error) {
        console.error(error)
        return (
            <Box>
                <Text>{error.message}:</Text>
                <code>{error.stack}</code>
            </Box>
        )
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
                        <TrackableCollection trackables={myTrackables} user={data.me} />
                    </Box>

                </Box>
            </Flex>
        </Box>
    )
}

function TrackableCollection({ trackables, user }: { trackables: Trackable[], user: User }) {
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
                    <Text> TODO: Drop Off Address </Text>
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
