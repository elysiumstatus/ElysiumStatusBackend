import cheerio from 'cheerio'
import { services } from '../../config'

const DOM = {
  POPULATION: 'div.realm-body > div:nth-child(2)',
  ALLIANCE: 'div.realm-body > div.progress > div.progress-bar.progress-bar-info',
  HORDE: 'div.realm-body > div.progress > div.progress-bar.progress-bar-danger',
  TIME: 'div.realm-body > div:nth-child(4)',
  UPTIME: 'div.realm-body > div:nth-child(5)'
}

export default function parseRealmStats(html) {
  const realmdata = {
    servers: {}
  }

  try {
    const $ = cheerio.load(html)
    const realms = $('.realm').each((i, val) => {
      const realmName = $(val).find('.realm-name').text().trim()

      if (realmName) {
        const population = $(val).find(DOM.POPULATION).text().trim().replace('Population: ', '')
        const percentAlliance = $(val).find(DOM.ALLIANCE).text().trim().replace('%', '')
        const percentHorde = $(val).find(DOM.HORDE).text().trim().replace('%', '')
        const serverTime = $(val).find(DOM.TIME).text().trim()
        const uptime = $(val).find(DOM.UPTIME).text().trim().replace('Uptime: ','')

        const filteredRealms = Object.keys(services)
          .map(key => services[key])
          .filter(e => e.websiteId === realmName)

        if (filteredRealms.length && filteredRealms[0].isRealm) {
          const realm = filteredRealms[0]
          realmdata.servers[realm.id] = {
            id: realm.id,
            uptime,
            population,
            server_time: serverTime,
            percentage_alliance: percentAlliance,
            percentage_horde: percentHorde
          }

        }
      }
    })

  } catch (e) {
    console.log('Error when parsing realmdata ' + e)
  }

  return realmdata
}
