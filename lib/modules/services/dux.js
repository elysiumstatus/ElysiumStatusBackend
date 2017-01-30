import _ from 'lodash'
import portscanner from 'portscanner'
import fetch from 'node-fetch'
import delay from '../../utils/delay'

const FETCH = 'SERVICES/FETCH'
const SAVE = 'SERVICES/SAVE'
const ERROR = 'SERVICES/ERROR'
const PURGE = 'SERVICES/PURGE'

const POLL_TIMEOUT_SUCCESS = (1 * 60) * 1000
const POLL_TIMEOUT_ERROR = (3 * 60) * 1000

const initialState = {}

export default function services(state = initialState, action) {
  switch (action.type) {
    case FETCH:
      return _.assign({}, state, {
        [action.id]: _.assign({}, state[action.id] || {}, {
          isFetching: true
        })
      })
    case SAVE:
      return _.assign({}, state, {
        [action.id]: _.assign({}, (state[action.id] || {}),{
          isFetching: false,
          lastUpdated: action.lastUpdated,
          status: action.status,
          history: action.history
        })
      })
    case ERROR:
      return _.assign({}, state, {
        [action.id]: _.assign({}, (state[action.id] || {}), {
          isFetching: false,
          status: false,
          lastUpdated: action.lastUpdated,
          error: action.error
        })
      })
    case PURGE:
      return state
    default:
      return state
  }
}


export function save(params) {
  return (dispatch, getState) => {
    const serviceCache = getState()[params.id] || {}
    let status = params.status
    let unstable = false
    let history = (serviceCache.history || []).slice()

    history.push(params.status)

    if (history.length > 10) {
      history = _.dropRight(history, 1)
    }

    if (_.filter(history, status => status === false).length > 2) {
      unstable = true
    }

    if (history.length <= 1) {
      status = undefined
    }

    dispatch(_.assign({ type: SAVE }, params, {
      history,
      unstable,
      status
    }))
  }
}

export function fetchPortStatus({ id, ip, port }, poll) {
  return (dispatch, getState) => {
    const checkRequests = []
    dispatch({ type: FETCH, id })
    return portscanner.checkPortStatus(port, ip)
      .then((portStatus) => {
        checkRequests.push(portStatus)
        return delay(1000)
      })
      .then(() => {
        return portscanner.checkPortStatus(port, ip)
      })
      .then((portStatus) => {
        let status = false
        const lastUpdated = new Date().toISOString()
        checkRequests.push(portStatus)
        if (checkRequests[0] === 'open' || checkRequests[1] === 'open') {
          status = true
        }
        dispatch(save({ status, lastUpdated, id }))
        // continue polling
        dispatch(pollPortStatus({ id, ip, port }, POLL_TIMEOUT_SUCCESS))
      })
      .catch(error => {
        console.error(error)
        const lastUpdated = new Date().toISOString()
        dispatch({ type: ERROR, id, error, lastUpdated })
        // continue polling
        dispatch(pollPortStatus({ id, ip, port }, POLL_TIMEOUT_ERROR))
      })
  }
}

export function fetchWebStatus({ url, id }, poll) {
  return (dispatch, getState) => {
    dispatch({ type: FETCH, id })
    return fetch(url, { timeout: 15000 })
      .then((response) => {
        let status = true
        const lastUpdated = new Date().toISOString()
        if (response.status !== 200) {
          status = false
        }
        dispatch(save({ status, lastUpdated, id }))
        // continue polling
        dispatch(pollWebStatus({ url, id }, POLL_TIMEOUT_SUCCESS))
      })
      .catch(error => {
        console.error(error)
        const lastUpdated = new Date().toISOString()
        dispatch({ type: ERROR, id, error, lastUpdated })
        // continue polling
        dispatch(pollWebStatus({ url, id }, POLL_TIMEOUT_ERROR))
      })
  }
}

function pollPortStatus(options, timeout = POLL_TIMEOUT_SUCCESS) {
  return dispatch => {
    setTimeout(() => dispatch(fetchPortStatus(options, timeout)), timeout)
  }
}

function pollWebStatus(options, timeout = POLL_TIMEOUT_SUCCESS) {
  return dispatch => {
    setTimeout(() => dispatch(fetchWebStatus(options, timeout)), timeout)
  }
}

export function poll(options, timeout = POLL_TIMEOUT_SUCCESS) {

  return dispatch => {
    console.log(`[${new Date().toISOString()}]: Now polling ${options.id}`)
    if (!options.id) {
      console.error('No id passed in params to poll')
    }

    if (options.port === 80) {
      dispatch(pollWebStatus(options, timeout))
    } else {
      dispatch(pollPortStatus(options, timeout))
    }
  }
}
