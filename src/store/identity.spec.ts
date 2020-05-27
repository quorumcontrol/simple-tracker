import 'mocha'
import {expect} from 'chai'
import { register } from './identity'

describe('Identity', ()=> {
    it('registers', async ()=> {
        const namespace = Buffer.from('registers')
        const user = await register(`bobby-${Math.random()}`, "mcgee", namespace)
        expect(user).to.not.be.undefined
    })
})