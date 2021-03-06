import { getAppCommunity } from './community'
import { User, verifyAccount, register } from './identity';
import { EcdsaKey, Repo } from 'tupelo-lite';
import debug from 'debug';
import { EventEmitter } from 'events';
const Key = require("interface-datastore").Key

// TODO: this needs a rewrite, it was brought in from ambient-stack
// but is way too much code for the new simpler graphql stuff

const log = debug("util.user")

const usernameKey = new Key("username")
const privateKeyKey = new Key("privateKey")

export class AppUser extends EventEmitter {
    user?: User
    userPromise?: Promise<User | undefined>
    repo: Promise<Repo>

    static userNamespace?: Buffer
    static events = new EventEmitter()
    private static namespaceSet = false

    static setUserNamespace = (namespace: string) => {
        log("userNamespace set to: ", namespace)
        AppUser.userNamespace = Buffer.from(namespace)
        AppUser.namespaceSet = true
        AppUser.events.emit('_usernamespace_set')
    }

    static afterRegister?: (user: User) => Promise<User>

    constructor() {
        super()
        this.repo = new Promise(async (resolve) => {
            const repo = new Repo('user')
            await repo.init({})
            await repo.open()
            resolve(repo)
        })
        if (AppUser.namespaceSet) {
            this.loadFromRepo()
        } else {
            AppUser.events.once('_usernamespace_set', () => {
                this.loadFromRepo()
            })
        }
    }

    async logout() {
        const repo = await this.repo
        await repo.delete(usernameKey)
        await repo.delete(privateKeyKey)
        this.user = undefined
        this.userPromise = undefined
        this.emit('update')
        return
    }

    async login(username: string, password: string): Promise<[boolean, User?]> {
        if (!AppUser.userNamespace) {
            throw new Error("you must call AppUser.setUserNamespace with something before login")
        }
        const repo = await this.repo
        const [found, user] = await verifyAccount(username, password, AppUser.userNamespace)
        if (found) {
            await repo.put(usernameKey, Buffer.from(username))
            //TODO: need to more securely store the private key here
            await repo.put(privateKeyKey, user?.tree.key?.privateKey!)
            this.user = user
            this.userPromise = Promise.resolve(user!)
            AppUser.events.emit('login', user)
            this.emit('update')
            return [true, user]
        }
        return [false, undefined]
    }

    async register(username: string, password: string): Promise<User> {
        if (!AppUser.userNamespace) {
            throw new Error("you must call AppUser.setUserNamespace with something before register")
        }
        log('registering user')
        const repo = await this.repo
        let user = await register(username, password, AppUser.userNamespace)
        await repo.put(usernameKey, Buffer.from(username))
        //TODO: need to more securely store the private key here
        await repo.put(privateKeyKey, user.tree.key?.privateKey!)

        if (AppUser.afterRegister) {
            user = await AppUser.afterRegister(user)
        }
        this.user = user
        this.userPromise = Promise.resolve(user)
        AppUser.events.emit('registered', user)
        this.emit('update')
        log('done')
        return user
    }

    async loadFromRepo() {
        if (this.userPromise) {
            return this.userPromise
        }

        this.userPromise = new Promise<User | undefined>(async (resolve) => {
            if (!AppUser.userNamespace) {
                throw new Error("you must call AppUser.setUserNamespace with something before loadFromRepo")
            }

            log("fetching user")
            const repo = await this.repo
            let username: string
            try {
                username = await repo.get(usernameKey)
            } catch (e) {
                if (e.code === "ERR_NOT_FOUND") {
                    resolve(undefined)
                    return // no user
                }
                throw e
            }

            const privateKey = await repo.get(privateKeyKey)

            const c = await getAppCommunity()
            const key = await EcdsaKey.fromBytes(privateKey)
            let user
            try {
                user = await User.find(username.toString(), AppUser.userNamespace, c)
            } catch (e) {
                if (e.message === "no tree found") {
                    await this.logout()
                    resolve(undefined)
                    return // no user
                }
                throw e
            }
            user.tree.key = key
            await user.load()
            resolve(user)
        })
        this.userPromise.then((user: User | undefined) => {
            this.user = user
        }).finally(() => {
            this.emit('update')
        })
        return this.userPromise
    }

}

export const appUser = new AppUser()
