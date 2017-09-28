import _ from 'lodash'
import fetch from 'node-fetch'
import delay from '../../utils/delay'
import parse from './parse'

const FETCH = 'realmdata/FETCH'
const SAVE = 'realmdata/SAVE'
const ERROR = 'realmdata/ERROR'
const PURGE = 'realmdata/PURGE'

const POLL_TIMEOUT_SUCCESS = (1 * 60) * 1000
const POLL_TIMEOUT_ERROR = (3 * 60) * 1000

const initialState = {}

export default function realmdata(state = initialState, action) {
  switch (action.type) {
    case SAVE:
      return _.assign({}, state, {
        isFetching: false,
        [action.id]: _.assign({}, (state[action.id] || {}), {
          id: action.id,
          uptime: action.uptime,
          population: action.population,
          server_time: action.server_time,
          percentage_alliance: action.percentage_alliance,
          percentage_horde: action.percentage_horde
        })
      })
    default:
      return state
  }
}

export function save({ servers = {} } = { }) {
  return (dispatch, getState) => {
    _.each(servers, (realm = {}) => {
      if (realm.id) {
        dispatch({ type: SAVE, id: realm.id, ...realm })
      }
    })
  }
}

export function parseRealmData(response) {
  return (dispatch, getState) => {
    return response.text()
      .then(html => {
        const realmdata = parse(html)
        dispatch(save(realmdata))
      })
      .catch(e => {
        console.log(e)
      })
  }
}
