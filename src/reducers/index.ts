import { combineReducers } from 'redux'
import trackableRedcuer from '../trackable/trackable_slice'

export default combineReducers({
  trackables: trackableRedcuer,
})