import {AppUser} from 'ambient-react'
import debug from 'debug'
import { User, Database } from 'ambient-stack'
import { v5 as uuidv5 } from 'uuid';

const log = debug("store")

export const userNamespace = 'local-only-tracker'

AppUser.setUserNamespace(userNamespace)

export interface TrackableUpdate {
    timestamp:number
    message:string
    metadata:{[key:string]:any}
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
    type: TrackableCollectionActions,
    name: string
}

const uuidNamespace = '121867b5-c602-443e-ae5e-020a49b638e9'

export const TrackableCollectionReducer = (doc: TrackableCollection, evt: TrackableCollectionUpdate) => {
    if (doc.trackables === undefined) {
        doc.trackables = {}
    }
    switch (evt.type) {
        case TrackableCollectionActions.ADD:
            const uuid = uuidv5(doc.userDid, uuidNamespace);
            const trackable:Trackable = {name: evt.name, id: uuid, updates:[]}
            doc.trackables[trackable.id] = trackable
            break;
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