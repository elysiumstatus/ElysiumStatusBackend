import 'source-map-support/register'
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import _ from 'lodash'

import { sendMessage } from './fcm'
import services, { fetchPortStatus, fetchWebStatus, poll } from './modules/services/dux'
import config from './modules/services/config'

const ORGANIZATION = 'elysium'

const store = createStore(services, applyMiddleware(thunk))

const states = { }

_.each(config[ORGANIZATION].services, (service) => {
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
      org: ORGANIZATION,
      name: config[ORGANIZATION].services[id].name,
      image: config[ORGANIZATION].services[id].image,
      isRealm: config[ORGANIZATION].services[id].isRealm,
      largeIcon: config[ORGANIZATION].services[id].largeIcon,
      status,
      unstable
     }

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

}

store.subscribe(function storeChange() {

  const newState = store.getState()

  _.each(config[ORGANIZATION].services, (service) => {
    const oldService = state[service.id] || {}
    let newService = newState[service.id] || {}

    const oldStatus = oldService.status
    let newStatus
    let unstable

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

_.each(config[ORGANIZATION].services, (service) => {
  state[service.id] = {}
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
