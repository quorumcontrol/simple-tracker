import React from 'react'
import { Text } from '@chakra-ui/core'
import { Address, AddressInput } from '../generated/graphql'


export function AddressComponent({ addr }: { addr: AddressInput | Address | undefined | null }) {
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
