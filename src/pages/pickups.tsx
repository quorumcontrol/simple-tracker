import React from 'react'
import { gql, useQuery, useMutation } from '@apollo/client'
import { Box, Spinner, Heading, Image, Text, Flex, Button, Icon } from '@chakra-ui/core'
import { Trackable, User, TrackableStatus } from '../generated/graphql'
import { Link} from 'react-router-dom'
import { useHistory } from "react-router-dom";
import Header from '../components/header'
import debug from 'debug'

const log = debug("pages.pickups")

const PICKUPS_PAGE_QUERY = gql`
    query PickUpsPage($filters: GetTrackablesFilter) {
        me {
            did
        }
        getTrackables(filters: $filters) {
            did
            trackables {
                did
                status
            }
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

    const available = data.getTrackables.trackables.filter((trackable: Trackable) => {
        return trackable.status == TrackableStatus.Published
    })

    return (
        <Box>
            <Header />
            <Flex mt={5} p={10} flexDirection="column">
                <Box>
                    <Box>
                        <TrackableCollection trackables={available} user={data.me} />
                    </Box>
                </Box>
            </Flex>
        </Box>
    )
}

function AcceptJobButton({trackable, user}:{trackable:Trackable, user:User}) {
    const [acceptJob] = useMutation(ACCEPT_JOB_MUTATION)
    const history = useHistory()

    const onClick = async ()=> {
        await acceptJob({
            variables: {
                input: {
                    trackable: trackable.did,
                    user: user.did,
                }
            },
        })
        history.push('/summary')
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
              <Text> TODO: Pick Up Address </Text>
              <Text> TODO: Drop Off Address </Text>
              { AcceptJobButton({trackable, user}) }
          </Box>
        )
    })
    return (
        <>
            {trackableElements}
        </>
    )
}
