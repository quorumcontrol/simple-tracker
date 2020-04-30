import React from 'react'
import { gql, useQuery } from '@apollo/client'
import { Box, Spinner, Heading, Image, Text, Flex } from '@chakra-ui/core'
import { Trackable, User, TrackableStatus } from '../generated/graphql'
import { getUrl } from '../lib/skynet'
import Header from '../components/header'
import debug from 'debug'

const log = debug("pages.summary")

const SUMMARY_PAGE_QUERY = gql`
    query SummaryPage($filters: GetTrackablesFilter) {
        me {
            did
        }
        getTrackables(filters: $filters) {
            did
            trackables {
                did
                status
                name
                image
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
            <Flex align="center" justify="center" h="100%">
                <Spinner />
                <Text ml="1rem">Loading donations</Text>
            </Flex>
        )
    }

    if (error) {
        return (
            <Box>
                <Text>{error}</Text>
            </Box>
        )
    }

    log("summary page data: ", data)

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

    const available = data.getTrackables.trackables.filter((trackable: Trackable) => {
        return trackable.status == TrackableStatus.Published
    })

    const myTrackables = data.getTrackables.trackables.filter((trackable: Trackable) => {
        return trackable.driver?.did === data.me.did && [TrackableStatus.Accepted, TrackableStatus.PickedUp].includes(trackable.status!)
    })

    console.log(myTrackables)

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Box mt="2" color="gray.600" fontSize="sm">
                        <Link to={`/pickups`}>Find more Deliveries <br /> ({available.length} Available) </Link> 
                    </Box>
                    <Box>
                        <Heading mb={3}>Your current deliveries</Heading>
                        <TrackableCollection trackables={myTrackables} user={data.me} />
                    </Box>

                </Box>
            </Flex>
        </Box>
    )
}

function TrackableCollection({ trackables, user }: { trackables: Trackable[], user: User }) {
    const trackableElements = trackables.map((trackable: Trackable) => {
        let link:string = ""
        switch(trackable.status) {
            case TrackableStatus.Accepted: {
                link = `/objects/${trackable.did}/pickup`
                break;
            }
            case TrackableStatus.PickedUp: {
                link = `/objects/${trackable.did}/dropoff`
                break;
            }
        }

        return (
            <Link to={link} key={trackable.did}>
                <Box p="5" ml="2" maxW="sm" borderWidth="1px" rounded="lg" overflow="hidden">
                    {trackable.image &&
                        <Image src={getUrl(trackable.image)} />
                    }
                    { trackable.status == TrackableStatus.PickedUp ?
                        <Text> <Icon name="check" /> Picked Up</Text>
                    :
                        <Text> TODO: Pick Up Address </Text>
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
