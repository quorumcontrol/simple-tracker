import {AppUser} from 'ambient-react'
import debug from 'debug'
import { User, Database } from 'ambient-stack'
import {uuid} from 'automerge'

const log = debug("store")

export const userNamespace = 'local-only-tracker'

AppUser.setUserNamespace(userNamespace)

export interface TrackableUpdate {
    timestamp?:number
    message:string
    metadata?:{[key:string]:any}
}

export interface Trackable {
    id:string
    name:string
    updates:TrackableUpdate[]
}

export interface TrackableCollection {
    userDid:string
    trackables: {[key:string]:Trackable}
}

export enum TrackableCollectionActions {
    ADD,
    //TODO: remove, udpdate?
}

export interface TrackableCollectionUpdate {
    type: TrackableCollectionActions
    trackable: Trackable
}

export enum TrackableActions {
    ADD,
    RENAME,
}

export interface TrackableAction {
    type: TrackableActions
    update?: TrackableUpdate
    name?:string
}

export async function addTrackable(dispatch:(update:TrackableCollectionUpdate)=>void, user:User, name:string) {
    const trackable:Trackable = {name: name, id: uuid(), updates:[]}
    log("addNewTrackable: ", trackable)
    const db = new Database<Trackable, TrackableAction>(trackable.id, TrackableReducer)
    await db.create(user!.tree.key!, {
        writers: [user?.did!],
        initialState: trackable,
    })
    dispatch({type: TrackableCollectionActions.ADD, trackable: trackable})
    return trackable
}

export function addUpdate(dispatch:(update:TrackableAction)=>void, update:TrackableUpdate) {
    dispatch({type:TrackableActions.ADD, update: update})
}

export const TrackableCollectionReducer = (doc: TrackableCollection, evt: TrackableCollectionUpdate) => {
    if (doc.trackables === undefined) {
        doc.trackables = {}
    }
    switch (evt.type) {
        case TrackableCollectionActions.ADD:
            const trackable = evt.trackable
            doc.trackables[trackable.id] = trackable
            break;
        default:
            console.error("unsupported action: ", evt)
    }
}


export const TrackableReducer = (doc: Trackable, evt: TrackableAction) => {
    if (doc.updates === undefined) {
        doc.updates = []
    }
    switch (evt.type) {
        case TrackableActions.ADD:
            let update = evt.update
            if (update === undefined) {
                throw new Error("must specify an update for ADD")
            }
            update.timestamp = (new Date()).getTime()
            doc.updates.push(update)
            break;
        case TrackableActions.RENAME:
            if (evt.name === undefined) {
                throw new Error("must specify a name in order to rename")
            }
            doc.name = evt.name
        default:
            console.error("unsupported action: ", evt)
    }
}

AppUser.afterRegister = async (user: User) => {
  log('setting up trackable collection')
  // setup their app database
  const did = await user.tree.id()
  const db = new Database<TrackableCollection, TrackableCollectionUpdate>(user.userName + "-trackables", TrackableCollectionReducer)
  await db.create(user.tree.key!, {
      writers: [did!],
      initialState: {
          userDid: did!,
          trackables:{},
      }
  })
  return user
}