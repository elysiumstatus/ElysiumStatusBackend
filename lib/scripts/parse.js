import fetch from 'node-fetch'
import { services } from '../config.json'
import parseRealmStats from '../modules/realmdata/parse'

const id = "1eda2b4c-a58e-44a3-b268-835dc8c66d1c"

const website = services[id]

fetch(website.url)
  .then((response) => {
    if (response.status !== 200) {
      console.error('Fetching Error')
    } else {
      response.text()
        .then((html) => {
          console.log(parseRealmStats(html, id))
        })
    }
  })
  .catch(error => {
    console.error(error)
  })
