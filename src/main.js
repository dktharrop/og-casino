import CasinoBot from './casino-bot.js'
import dotenv from 'dotenv'

dotenv.config()
const devMode = (process.env.DEVMODE) ? true : false
const accounts = JSON.parse(process.env.ACCOUNTS)

if (devMode) {
  console.log('----------------------------------------')
  console.log('\tDEVELOPMENT MODE ENABLED')
  console.log('----------------------------------------')
}
const account = (devMode) ? accounts[1] : accounts[2]

const bots = []

startBot({
  username: account.username,
  password: account.password,
  auth: 'microsoft',
  host: 'og-network.net',
  port: '25565',
  version: '1.20',
  viewDistance: 3,
  hideErrors: false,
})

export function startBot (botArgs) {
  bots.push(new CasinoBot(botArgs))
}

export function stopBot (userIndex) {
  bots[userIndex].bot.quit()
  bots.splice(userIndex, 1)
}
