const redis = require('redis')
const flat = require('flat')

const flatOptions = { overwrite: true }

function trimPrefix(key, separator) {
  return key.split(separator)[1];
}

module.exports = class Redis {
  constructor(options = {}) {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379
    })
    this.PREFIX = options.prefix || 'servers'
    this.SEPERATOR = options.keySeperator || ':'
    this.type = 'Object'
    this.data = {}
    this.id = ''
  }

  set(id, data) {
    this.id = id || this.id
    const key = this.key(id)
    this.type = data instanceof Object ? 'Object' : (data instanceof Array ? 'Array' : 'String')
    data = flat.flatten(data)
    return new Promise((resolve, reject) => {
      if(data instanceof Object) {
        return this.client.hmset(key, data, function(err, result) {
          if (err) {
            return reject(err)
          }
          resolve(result)
        })
      }
      this.client.set(key, data, function(err, result) {
        if(err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  get(id, property) {
    this.id = id
    const key = this.key(id)
    return new Promise((resolve, reject) => {
      if(!property) {
        return this.client.hgetall(key, (err, result) => {
          if(err) {
            return reject(err)
          }
          this.data = flat.unflatten(result, flatOptions)
          resolve(this)
        })
      }
      this.client.hget(key, property, (err, result) => {
        if(err) {
          return reject(err)
        }
        this.data ? this.data[property] = result : this.data = { [property]: result}
        this.data = flat.unflatten(this.data, flatOptions)
        resolve(this)
      })
    })
  }

  getAll() {
    const data = {}

    return new Promise((resolve, reject) => {
      this.client.keys(`${this.PREFIX}${this.SEPERATOR}*`, (err, keys) => {
        const SEPERATOR = this.SEPERATOR

        if (err) return reject(err)

        if (!keys.length) return resolve(0)
        const promises = []
        keys.forEach((key, i) => {
          return this.client.hgetall(keys[i], (err, result) => {
            if (err) {
              return reject(err)
            }

            const id = trimPrefix(keys[i], SEPERATOR)
            data[id] = flat.unflatten(result)
            if (i === keys.length - 1) {
              return resolve(data)
            }
          })
        })
      })
    })
  }

  key(id) {
    id = id || this.id;
    return `${this.PREFIX}${this.SEPERATOR}${id}`;
  }

}
