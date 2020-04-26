import React from 'react'
import { gql, useQuery } from '@apollo/client'
import { Box, Spinner, Heading, Image, Text, Flex} from '@chakra-ui/core'
import { Trackable } from '../generated/graphql'
import { useHistory } from 'react-router-dom'
import Header from '../components/header'

const SUMMARY_PAGE_QUERY = gql`
    query SummaryPage($filters: GetTrackablesFilter) {
        me {
            did
        }
        getTrackables(filters: $filters) {
            did
            trackables {
                did
            }
        }
    }
`

export function SummaryPage() {
    const { data, loading, error } = useQuery(SUMMARY_PAGE_QUERY)

    if (loading) {
        return (
            <Box>
                <Spinner />
            </Box>
        )
    }

    if (error) {
        return (
            <Box>
                <Text>{error}</Text>
            </Box>
        )
    }

    const unowned = data.getTrackables.trackables.filter((trackable: Trackable) => {
        return !trackable.driver
    })

    const myTrackables = data.getTrackables.trackables.filter((trackable: Trackable) => {
        return trackable.driver === data.me.did
    })

    return (
        <Box>
        <Header />
        <Flex mt={5} p={10} flexDirection="column">
        <Box>
            <Box>
                Find more deliveries
                ({unowned.length}) available
            </Box>
            <Heading>Your current deliveries</Heading>
            <TrackableCollection trackables={myTrackables} />
        </Box>
        </Flex>
        </Box>
    )
}

function TrackableCollection({ trackables }: { trackables: Trackable[] }) {
    const history = useHistory()

    const trackableElements = trackables.map((trackable: Trackable) => {
        return (

            <Box p="5" ml="2" maxW="sm" borderWidth="1px" rounded="lg" overflow="hidden" key={trackable.did} onClick={() => { history.push(`/objects/${trackable.did}`) }}>
                {/* {trackable.image &&
                    <Image src={getUrl(trackable.image)} />
                } */}
                <Box
                    mt="1"
                    fontWeight="semibold"
                    as="h4"
                    lineHeight="tight"
                    isTruncated
                >
                    {trackable.name}
                </Box>
                <Box mt="2" color="gray.600" fontSize="sm">
                    {trackable.did}
                </Box>
            </Box>
        )
    })
    return (
        <>
            {trackableElements}
        </>
    )
}