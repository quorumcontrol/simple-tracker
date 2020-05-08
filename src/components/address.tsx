import React from 'react'
import { Text } from '@chakra-ui/core'
import { AddressInput } from '../generated/graphql'


export function PickupAddr({ addr }: { addr: AddressInput | undefined }) {
    if (!addr) {
        return <Text>Unknown pickup address</Text>
    }
    return (
        <Text>
            {addr.street}<br />
            {addr.cityStateZip}
        </Text>
    )
}

export default PickupAddr
