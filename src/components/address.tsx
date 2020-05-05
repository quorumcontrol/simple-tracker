import React from 'react'
import { Text } from '@chakra-ui/core'
import { AddressInput } from '../generated/graphql'


export function AddressComponent({ addr }: { addr: AddressInput | undefined }) {
    if (!addr) {
        return <Text>Unknown address</Text>
    }
    return (
        <Text>
            {addr.street}<br />
            {addr.cityStateZip}
        </Text>
    )
}

export default AddressComponent
