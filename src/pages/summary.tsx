import React from 'react'
import { gql, useQuery, useMutation } from '@apollo/client'
import { Box, Spinner, Heading, Image, Text, Flex, Button } from '@chakra-ui/core'
import { Trackable, User } from '../generated/graphql'
import { Link} from 'react-router-dom'
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
                driver
            }
        }
    }
`
const ACCEPT_JOB_MUTATION = gql`
    mutation SummaryPageAccept($input: AcceptJobInput!) {
        acceptJob(input: $input) {
            code
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
                        <Heading>Your current deliveries</Heading>
                        <TrackableCollection trackables={myTrackables} user={data.me} />
                    </Box>
                    <Box>
                        <Heading>Deliveries needing pickup</Heading>
                        <TrackableCollection trackables={unowned} user={data.me}/>
                    </Box>
                </Box>
            </Flex>
        </Box>
    )
}

function AcceptJobButton({trackable, user}:{trackable:Trackable, user:User}) {
    const [acceptJob] = useMutation(ACCEPT_JOB_MUTATION)

    const onClick = async ()=> {
        await acceptJob({
            variables: {
                input: {
                    trackable: trackable.did,
                    user: user.did,
                }
            },
            refetchQueries: [{query: SUMMARY_PAGE_QUERY}]
        })
    }

    return (
        <Button onClick={onClick}>Accept Job</Button>
    )
}

function TrackableCollection({ trackables,user }: { trackables: Trackable[],user:User }) {

    const trackableElements = trackables.map((trackable: Trackable) => {
        return (

            <Box p="5" ml="2" maxW="sm" borderWidth="1px" rounded="lg" overflow="hidden" key={trackable.did}>
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
                    <Link to={`/objects/${trackable.did}`}>{trackable.did}</Link> 
                </Box>
                {!trackable.driver && <AcceptJobButton trackable={trackable} user={user}/>}
            </Box>
        )
    })
    return (
        <>
            {trackableElements}
        </>
    )
}