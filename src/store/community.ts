import { Community, Repo, localURL } from 'tupelo-lite'
import debug from 'debug'

const log = debug("appCommunity")

let _appCommunityPromise: Promise<Community>

const remoteURL = "https://8awynb7la6.execute-api.us-east-1.amazonaws.com/dev/graphql"

export function getAppCommunity(): Promise<Community> {
    log("fetching app community")
    if (_appCommunityPromise !== undefined) {
        log("returning app community")
        return _appCommunityPromise
    }
    _appCommunityPromise = new Promise(async (resolve) => {
        const r = new Repo("appcommunity")
        await r.init({})
        await r.open()

        switch (process.env.NODE_ENV) {
            case "production":
                log("using production community")
                resolve(new Community(remoteURL, r))
                break;
            default:
                log("using development community")
                resolve(new Community(localURL, r))
        }
    })
    return _appCommunityPromise
}
getAppCommunity()
