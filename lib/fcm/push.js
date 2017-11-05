import { sendMessage } from './index.js'

import config from '../config.json'

const ARG_REGEX = /\-[a-z](?!\w)/ig

const argMap = {
  '-s': 'server',
  '-c': 'status',
  '-u': 'unstable'
}

let args = { }

process.argv.slice(2).forEach(function (val, index, array) {
  if (ARG_REGEX.test(val)) {
    if (val.indexOf('-h') > -1) {
      console.log('Usage', argMap)
      process.exit(0)
    }
    const argKey = argMap[val] || val
    const argValue = array[index + 1]
    args[argKey] = argValue
  }
})

function toBoolean(string) {
  var num = +string;
  return !isNaN(num) ? !!num : !!String(string).toLowerCase().replace(!!0,'')
}

const status = typeof args.status !== 'undefined' ? toBoolean(args.status) : true
const unstable = typeof args.unstable !== 'undefined' ? toBoolean(args.unstable) : false

if (config.services[args.server]) {
  sendMessage({ ...config.services[args.server], status, unstable })
} else {
  console.error(`Server (${args.server}) doesn't exist in config.json`)
}
