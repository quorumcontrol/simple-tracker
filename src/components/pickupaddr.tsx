import React from 'react'
import { Text } from '@chakra-ui/core'


export function PickupAddr({addr}:{addr:{street:string,cityStateZip:string}|undefined}) {
    if (!addr) {
        return <Text>Unknown pickup address</Text>
    }
    return (
        <Text> 
            {addr.street}<br/>
            {addr.cityStateZip}
        </Text>
    )
}

export default PickupAddr