import React from 'react'
import { Text } from '@chakra-ui/core'
import { Address } from '../generated/graphql'

export function RecipientAddress({ addr }: { addr: Address | undefined }) {
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

export default RecipientAddress
