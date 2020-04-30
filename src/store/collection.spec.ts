import 'mocha';
import { expect } from 'chai';
import { AppCollection } from './collection';
import { getAppCommunity } from './community';
import { ChainTree, EcdsaKey, setDataTransaction, Tupelo } from 'tupelo-wasm-sdk';
import { Trackable } from '../generated/graphql';

const namespace = "testnamespace"

describe('AppCollection', () => {
    it('works with an unknown tree', async () => {
        await getAppCommunity()
        const name = `tree-${Math.random()}`
        const collection = new AppCollection({ name: name, namespace: namespace })

        const trackable: Trackable = {
            did: 'nonsense',
            updates: {},
        }

        const proof = await collection.addTrackable(trackable)
        expect(proof).to.not.be.undefined

        expect((await collection.getTrackables()).map((t) => { return t.did })).to.include(trackable.did)
    })

    it('adds to an existing tree', async () => {
        const c = await getAppCommunity()
        const name = `tree-${Math.random()}`
        const key = await EcdsaKey.passPhraseKey(Buffer.from(name), Buffer.from(namespace))
        let tree = await ChainTree.newEmptyTree(c.blockservice, key)
        await c.playTransactions(tree, [setDataTransaction('nothing', 'toseehere')])
        const collection = new AppCollection({ name: name, namespace: namespace })

        const trackable: Trackable = {
            did: 'nonsense',
            updates: {},
        }

        const proof = await collection.addTrackable(trackable)
        expect(proof).to.not.be.undefined
        tree = await Tupelo.getLatest(await key.toDid())
        const resp = await tree.resolveData(`trackables/${trackable.did}`)
        expect(resp.value).to.be.false // false means 'unowned'
    })

    it('resolves conflicts from two different collections writing', async () => {
        const c = await getAppCommunity()
        const name = `tree-${Math.random()}`

        const collection1 = new AppCollection({ name: name, namespace: namespace })
        const collection2 = new AppCollection({ name: name, namespace: namespace })

        const trackable1: Trackable = {
            did: 'did:tupelo:trackable1',
            updates: {},
        }
        const trackable2: Trackable = {
            did: 'did:tupelo:trackable2',
            updates: {},
        }

        const proof = await collection1.addTrackable(trackable1)
        const proof2 = await collection2.addTrackable(trackable2)
        expect(proof).to.not.be.undefined
        expect(proof2).to.not.be.undefined
        await collection1.updateTree()
        await collection2.updateTree()
        expect((await collection1.getTrackables()).map((t) => { return t.did })).to.have.members([trackable1.did, trackable2.did])
        expect((await collection2.getTrackables()).map((t) => { return t.did })).to.have.members([trackable1.did, trackable2.did])
    })

    it('can own a trackable', async () => {
        await getAppCommunity()
        const name = `tree-${Math.random()}`
        const collection = new AppCollection({ name: name, namespace: namespace })

        const trackable: Trackable = {
            did: 'nonsense',
            updates: {},
        }

        const proof = await collection.addTrackable(trackable)
        expect(proof).to.not.be.undefined



        expect((await collection.getTrackables()).some((listTrackable) => {
            return listTrackable.did === trackable.did
        })).to.be.true

        await collection.ownTrackable(trackable, { did: "did:test:userDid" })
    })

})
