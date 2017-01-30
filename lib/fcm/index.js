import fetch from 'node-fetch'
import os from 'os'
import delay from '../utils/delay'

const ENV = process.env.ENVIRONMENT || 'dev'

const creds = require(`${os.homedir()}/.fcm/creds.json`)

function createMessageAndroid({ name, id, status, unstable, image, isRealm, largeIcon }) {
  return {
    custom_notification: {
      id,
      click_action: '+1',
      body: `${name} is now online${unstable ? '. Service maybe unstable' : ''}`,
      title: isRealm ? 'Realm Alert' : 'Service Alert',
      group: isRealm ? 'realm' : 'service',
      priority: 'high',
      icon: 'ic_notification',
      large_icon: largeIcon || '',
      color: '#512DA8',
      lights: true,
      show_in_foreground: true,
      realm: {
        id,
        status,
        image,
        title: name,
      }
    }
  }
}

// TODO: Add iOS Push support
// function createMessageiOS({ name, id, status, unstable, image, isRealm }) {
//   return {
//     click_action: '+1',
//     body: `${name} is now online${unstable ? '. Service maybe unstable' : ''}`,
//     title: isRealm ? 'Realm Alert' : 'Service Alert',
//     priority: 'high',
//     icon: 'ic_notification',
//     show_in_foreground: true,
//     realm: {
//       id,
//       status,
//       image,
//       title: name,
//     }
//   }
// }

function fcmPost(method, headers, body) {
  return fetch('https://fcm.googleapis.com/fcm/send', { method, headers, body })
    .then(function(response) {
      if (response.status >= 400) {
        console.error('HTTP Error: ' + response.statusText)
      } else {
        return response.json()
          .then(function(json) {
            console.log(json)
            return json
          })
      }
    })
}

function sendPush(to, data) {
  const method = 'POST'
  const headers = {
    'Content-Type' : 'application/json',
    'Authorization': `key=${creds.key}`
  }
  const body = JSON.stringify({ data, to, time_to_live: 30 })
  return fcmPost(method, headers, body)
    .catch((error) => {
      console.error('1st fcmPost failure', error)
      return delay(4000)
        .then(() => {
          returnfcmPost(method, headers, body)
        })
        .catch((error) => {
          console.error('2st fcmPost failure', error)
        })
    })
}

export function sendMessage(params) {
  if (!params) {
    console.error('Attempted to send a blank message')
  }

  const messageAndroid = createMessageAndroid(params)
  const topic = `/topics/${ENV}.${params.org}.${params.id}`

  sendPush(topic, messageAndroid)
}
