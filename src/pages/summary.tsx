import React from 'react'
import { gql, useQuery, useMutation } from '@apollo/client'
import { Box, Spinner, Heading, Image, Text, Flex, Button, List, ListItem } from '@chakra-ui/core'
import { Trackable, User, TrackableStatus, TrackableUpdate, MetadataEntry } from '../generated/graphql'
import { Link } from 'react-router-dom'
import Header from '../components/header'
import debug from 'debug'
import { Address } from './donate'

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
                updates {
                    edges {
                        timestamp
                        message
                        metadata {
                            key
                            value
                        }
                    }
                }
                driver {
                    did
                }
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

    const available = data.getTrackables.trackables.filter((trackable: Trackable) => {
        return trackable.status == TrackableStatus.Published
    })

    const myTrackables = data.getTrackables.trackables.filter((trackable: Trackable) => {
        return trackable.driver?.did === data.me.did && [TrackableStatus.Accepted, TrackableStatus.PickedUp].includes(trackable.status!)
    })

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Box>
                        <Heading mb={3}>Your current deliveries</Heading>
                        <TrackableCollection trackables={myTrackables} user={data.me} />
                    </Box>
                    <Box>
                        <Heading mb={3}>Deliveries needing pickup</Heading>
                        <TrackableCollection trackables={available} user={data.me} />
                    </Box>
                </Box>
            </Flex>
        </Box>
    )
}

function AcceptJobButton({ trackable, user }: { trackable: Trackable, user: User }) {
    const [acceptJob] = useMutation(ACCEPT_JOB_MUTATION)

    const onClick = async () => {
        await acceptJob({
            variables: {
                input: {
                    trackable: trackable.did,
                    user: user.did,
                }
            },
            refetchQueries: [{ query: SUMMARY_PAGE_QUERY }]
        })
    }

    return (
        <Button mt="2" onClick={onClick}>Accept Job</Button>
    )
}

function TrackableCollection({ trackables, user }: { trackables: Trackable[], user: User }) {

    const trackableElements = trackables.map((trackable: Trackable) => {
        return (

            <Box p="5" mb="3" ml="2" maxW="md" borderWidth="1px" rounded="lg" overflow="hidden" key={trackable.did}>
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
                <Box mt="2">
                    <Updates trackable={trackable} />
                </Box>
                {!trackable.driver && <AcceptJobButton trackable={trackable} user={user} />}
            </Box>
        )
    })
    return (
        <>
            {trackableElements}
        </>
    )
}

function Updates({ trackable }: { trackable: Trackable }) {
    const updateElements = trackable.updates?.edges?.map((update: TrackableUpdate) => {
        return (
            <ListItem>
                {update.message} <Metadata metadata={update.metadata!} />
            </ListItem>
        )
    })

    return (
        <List styleType="disc">
            {updateElements}
        </List>
    )
}

// TODO: There's probably a better way to do this
function isAddress(val: any | undefined): boolean {
    if (val === undefined) {
        return false
    }

    if (typeof val === "object") {
        const obj = val as Object
        if (obj.hasOwnProperty("street") && obj.hasOwnProperty("cityStateZip")) {
            return true
        }
    }

    return false
}

function Metadata({ metadata }: { metadata: MetadataEntry[] }) {
    const mdElements = metadata.map((m: MetadataEntry) => {
        return (
            <ListItem>{m.key}: {isAddress(m.value) ? <AddressElement address={m.value as Address} /> : '???'}</ListItem>
        )
    })

    return (
        // TODO: Not sure why this isn't nesting inside its containing list
        <List styleType="circle">
            {mdElements}
        </List>
    )
}

function AddressElement({ address }: { address: Address }) {
    return (
        <>
            {address.street}, {address.cityStateZip}
        </>
    )
}
