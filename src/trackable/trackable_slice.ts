import { createSlice } from '@reduxjs/toolkit'

export interface Trackable {
    name:string
}

const trackableSlice = createSlice({
    name: 'trackables',
    initialState: [] as Trackable[],
    reducers: {
        addObject: (state, action) => {
            const { name } = action.payload
            state.push({ name })
        }
    },
})

export const { addObject } = trackableSlice.actions

export default trackableSlice.reducer