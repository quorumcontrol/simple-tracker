import {AppUser} from 'ambient-react'
import debug from 'debug'
import { User, Database, getAppCommunity } from 'ambient-stack'
import { EcdsaKey, ChainTree, setDataTransaction, setOwnershipTransaction } from 'tupelo-wasm-sdk'
import CID from 'cids'

const log = debug("store")

export const userNamespace = 'local-only-tracker'

AppUser.setUserNamespace(userNamespace)

export interface TrackableUpdate {
    timestamp?:string // ISO standard string
    message:string
    metadata?:{[key:string]:any}
    user?:string //did
    userName?:string
}

export interface Trackable {
    id:string
    name:string
    updates:TrackableUpdate[]
    latestTip?:CID
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

export async function addTrackable(dispatch:(update:TrackableCollectionUpdate)=>void, user:User, name:string) {
    const c = await getAppCommunity()
    const key = await EcdsaKey.generate()
    const tree = await ChainTree.newEmptyTree(c.blockservice, key)
    const did = await tree.id()
    const trackable:Trackable = {name: name, id: did!, updates:[], latestTip:tree.tip}

    await c.playTransactions(tree, [
        setDataTransaction("_tracker", trackable),
        setOwnershipTransaction([await user.tree.key?.address()!])
    ])
    dispatch({type: TrackableCollectionActions.ADD, trackable: trackable})
    return trackable
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