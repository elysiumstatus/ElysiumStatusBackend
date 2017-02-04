import fetch from 'node-fetch'
import os from 'os'
import delay from '../utils/delay'

const ENV = process.env.ENVIRONMENT || 'dev'

const creds = require(`${os.homedir()}/.fcm/creds.json`)

function createMessageData({ name, id, status, unstable, image, isRealm, largeIcon }) {
  let body
  if (status) {
    body = `${name} is now online${unstable ? '. Service maybe unstable' : ''}`
  } else {
    body = `${name} is now offline`
  }

  return  {
    id,
    body,
    click_action: '+1',
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

function createNotificationAndroid(message) {
  return {
    custom_notification: message
  }
}

function createNotificationiOS(message) {
  return {
    body: message.body,
    title: message.title,
    icon: 'appicon'
  }
}

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

  const body = JSON.stringify({ ...data, to, time_to_live: 30 })

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

  const data = createMessageData(params)

  const notificationAndroid = createNotificationAndroid(data)
  const topicAndroid = `/topics/android.${ENV}.${params.org}.${params.id}`
  sendPush(topicAndroid, { data: notificationAndroid })

  const notificationIOS = createNotificationiOS(data)
  const topicIOS = `/topics/ios.${ENV}.${params.org}.${params.id}`
  sendPush(topicIOS, { notification: notificationIOS, data: { realm: data.realm }, content_available: true, priority: 'high' })
}
