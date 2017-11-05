import parseLightsHopeWebStatus from './lightshope'
import parseElysiumWebStatus from './elysium'

export default function parseRealmStats(html, id) {
  if (id === '1eda2b4c-a58e-44a3-b268-835dc8c66d1c') {
    return parseLightsHopeWebStatus(html)
  }

  // Currently broken
  // if (id === 'website') {
  //   return parseElysiumWebStatus(html)
  // }
}
