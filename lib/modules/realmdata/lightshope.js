import cheerio from 'cheerio'
import { services } from '../../config'

const DOM = {
  POPULATION: '.realm-status__players',
  UPTIME: '.realm-status__uptime'
}

function cleanupUptime(uptime) {
  if (uptime) {
    // Massage input from scrape
    return uptime.replace('0 days, ', '').replace('minutes and', 'mintues, and')
  }
}

export default function parseLightsHopeWebStatus(html) {
  const realmdata = {
    servers: {}
  }

  try {
    const $ = cheerio.load(html)
    const realms = $('.realm-status__realm').each((i, val) => {
      const realmName = $(val).find('.realm-status__realm-name').text().trim()

      if (realmName) {
        const population = $(val).find(DOM.POPULATION).text().trim().replace(' Online', '').replace(' Offline', '')
        const uptime = $(val).find(DOM.UPTIME).text().trim().replace('Uptime: ','')

        const filteredRealms = Object.keys(services)
          .map(key => services[key])
          .filter(e => e.websiteId === realmName)

        if (filteredRealms.length && filteredRealms[0].isRealm) {
          const realm = filteredRealms[0]
          realmdata.servers[realm.id] = {
            id: realm.id,
            uptime: cleanupUptime(uptime),
            population
          }

        }
      }
    })

  } catch (e) {
    console.log('Error when parsing realmdata ' + e)
  }

  return realmdata
}
