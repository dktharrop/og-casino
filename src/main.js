import CasinoBot from './casino-bot.js'
import dotenv from 'dotenv'
import Crash from './games/crash.js'

// import all games as classes programatically?

dotenv.config()
const devMode = (process.env.DEVMODE === 'true')
const accounts = JSON.parse(process.env.ACCOUNTS)

if (devMode) {
  console.log('----------------------------------------')
  console.log('\tDEVELOPMENT MODE ENABLED')
  console.log('----------------------------------------')
}
const account = (devMode) ? accounts[1] : accounts[2]

export class CasinoManager { // make everything static
  constructor () {
    this.bots = []
    this.games = {
      crash: Crash
    }

    this.startBot({
      username: account.username,
      password: account.password,
      auth: 'microsoft',
      host: 'og-network.net',
      port: '25565',
      version: '1.20',
      viewDistance: 3,
      hideErrors: false
    })

    this.games.crash.startGame(this.bots[0].bot)
  }

  startBot (botArgs) {
    const bot = new CasinoBot(botArgs)
    bot.init() // Assuming CasinoBot has an async init method
    this.bots.push(bot)
  }

  stopBot (userIndex) {
    this.bots[userIndex].bot.quit()
    this.bots.splice(userIndex, 1)
  }
}

const casinoManager = new CasinoManager()

export default casinoManager
