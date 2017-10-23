import 'source-map-support/register'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import _ from 'lodash'

import { sendMessage } from './fcm'
import Redis from './redis'
import services, { fetchPortStatus, fetchWebStatus, poll, cache } from './modules/services/dux'
import realmdata from './modules/realmdata/dux'
import config from './config'

const store = createStore(combineReducers({
  services,
  realmdata,
}), applyMiddleware(thunk))

const states = { }

store.dispatch(cache(config.services))

const serverRedis = new Redis()
const realmdataRedis = new Redis({ prefix: 'realmdata' })

_.each(config.services, (service) => {
  states[service.id] = {
    up: 0,
    down: 0,
    unstable: 0
  }
})

function updateState(id, status, oldStatus, unstable) {
  if (status) {
    states[id].up = states[id].up + 1
    const service = {
      id,
      organizationId: config.services[id].organizationId,
      name: config.services[id].name,
      image: config.services[id].image,
      isRealm: config.services[id].isRealm,
      largeIcon: config.services[id].largeIcon,
      status,
      unstable
     }

    // This prevents notitfications being sent we bring up the server
    // for the first time
    if (typeof oldStatus !== 'undefined') {
      sendMessage(service)
    }
  } else {
    states[id].down = states[id].down + 1
  }

  if (unstable) {
    states[id].unstable = states[id].unstable + 1
  }
}

let state = {
  services: {},
  realmdata: {}
}

store.subscribe(function storeChange() {

  const newState = store.getState()

  if (newState.realmdata !== state.realmdata) {
    _.each(config.services, (service) => {
      if (newState.realmdata[service.id] && newState.realmdata[service.id] !== state.realmdata) {
        realmdataRedis.set(service.id, newState.realmdata[service.id])
      }
    })
  }

  if (newState.services === state.services) {
    return
  }

  _.each(config.services, (service) => {
    const oldService = state.services[service.id] || {}
    let newService = newState.services[service.id] || {}

    const oldStatus = oldService.status
    let newStatus
    let unstable

    if (service.id && oldService.lastUpdated !== newService.lastUpdated) {
      // Asynchronously update cache
      if (!newService.isFetching && newService.status !== undefined && newService.status !== null) {
        serverRedis.set(service.id, newService)
      }
    }

    if (oldService.status !== newService.status) {
      if (!oldService.status && newService.status) {
        console.log(`[${newService.lastUpdated}]: ${service.id} is ${newService.status ? 'Online' : 'Offline' }`)
        newStatus = newService.status
      } else if (oldService.status && !newService.status) {
        console.log(`[${newService.lastUpdated}]: ${service.id} is ${newService.status ? 'Online' : 'Offline' }`)
        newStatus = newService.status
      }
    }

    if (newService.unstable) {
      console.log(`[${newService.lastUpdated}]: ${service.id} may be unstable' }`)
      unstable = true
    }

    if (newStatus || newStatus === false) {
      updateState(service.id, newStatus, oldStatus, unstable)
    }
  })

  state = newState
})

_.each(config.services, (service) => {
  state.services[service.id] = {}
  store.dispatch(poll(service, 0))
})

// Prevent process from closing immediately
process.stdin.resume()
let exitHandled = false
function exitHandler(options = {}, err) {
  if (exitHandled) {
    return
  }

  console.log(states)

  exitHandled = true
  if (err) {
    console.log(err.stack)
  }

  if (options.exit) {
    process.exit()
  }
}

process.on('exit', exitHandler)
process.on('SIGINT', exitHandler.bind(null, { exit: true }))
process.on('uncaughtException', exitHandler.bind(null, { exit: true }))
