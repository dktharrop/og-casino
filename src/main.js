import CasinoBot from './casino-bot.js'
import dotenv from 'dotenv'

// import all games as classes programatically?

dotenv.config()
const devMode = (process.env.DEVMODE === 'true')
const accounts = JSON.parse(process.env.ACCOUNTS)

if (devMode) {
  console.log('----------------------------------------')
  console.log('\tDEVELOPMENT MODE ENABLED')
  console.log('----------------------------------------')
}

export class CasinoManager { // make everything static
  constructor () {
    this.devName = process.env.DEV
    this.devMode = devMode
    this.testers = JSON.parse(process.env.TESTERS)
    this.bots = []
    this.activeUsers = {}

    // this.crash.startGame(this.bots[0].bot)
  }

  startBot (botArgs) {
    const bot = new CasinoBot(botArgs)
    bot.init()
    this.bots.push(bot)
  }

  stopBot (userIndex) {
    this.bots[userIndex].bot.quit()
    this.bots.splice(userIndex, 1)
  }

  setUserStatus (username, status) {
    this.activeUsers[username] = status
  }

  setUserFree (username) {
    delete this.activeUsers[username]
  }

  getUserStatus (username) {
    return this.activeUsers[username]
  }
}

const casinoManager = new CasinoManager()

for (const account of accounts) {
  if (devMode && (account === accounts[0] || account === accounts[1])) {
    const botArgs = {
      username: account.username,
      password: account.password,
      auth: 'microsoft',
      host: 'og-network.net',
      port: '25565',
      version: '1.20',
      viewDistance: 3,
      hideErrors: false
    }
    casinoManager.startBot(botArgs)
  } else if (!devMode && account !== accounts[0]) {
    const botArgs = {
      username: account.username,
      password: account.password,
      auth: 'microsoft',
      host: 'og-network.net',
      port: '25565',
      version: '1.20',
      viewDistance: 3,
      hideErrors: false
    }
    casinoManager.startBot(botArgs)
  }
}

export default casinoManager
