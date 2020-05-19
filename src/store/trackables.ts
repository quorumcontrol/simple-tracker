import { Trackable, TrackableUpdate } from "../generated/graphql"

export type EnhancedUpdate = TrackableUpdate & { timestampDate: Date, image: any }

export function enhanceUpdates(trackable: Trackable): EnhancedUpdate[] | undefined {
    return trackable.updates.edges?.map((u: TrackableUpdate) => {
        return {
            ...u,
            timestampDate: new Date(u.timestamp),
            image: u.metadata?.find((m) => m.key === "image")?.value,
        }
    })
}

export function sortUpdates(trackable: Trackable): EnhancedUpdate[] | undefined {
    return enhanceUpdates(trackable)?.sort((a, b) => {
        return a.timestampDate.getTime() - b.timestampDate.getTime()
    })
}
