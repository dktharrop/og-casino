import casinoManager from '../../main.js'
import * as jsonManager from '../../json-manager.js'

export default {
  name: 'crash',
  aliases: ['cr'],
  description: 'Claim before the crash!',
  skipQueue: 'true',
  devOnly: false,
  execute: async (casinoBot, args, username) => {
    if (!casinoBot.crash) {
      casinoBot.crash = new Crash(casinoBot)
      // casinoBot.Crash.startGame(casinoBot)
    }
    for (const bot of casinoManager.bots) {
      if (bot.crash?.players) {
        for (const player of bot.crash.players) {
          if (player?.username === username) {
            casinoBot.bot.tell(username, 'You are already playing crash!')
            return
          }
        }
      }
    }
    casinoBot.crash.joinGame(username)
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class Crash {
  constructor (casinoBot) {
    this.casinoBot = casinoBot
    this.players = []

    this.startGame()
  }

  static crashPoint = 1
  static multiplier = 0
  static gameInterval = null

  static getCrashPoint () {
    const r = Math.random()

    const e = 2 ** 32
    const h = r * e

    if (r < 0.08) return 0 // 8% chance of immediate crash
    const crashPoint = Math.floor((100 * e - h) / (e - h)) / 100
    if (crashPoint > 50) return (50 + (10 * Math.random()))
    return (crashPoint < 1) ? (crashPoint + 0.5 * (1 - crashPoint) + 0.5) : crashPoint
  }

  async joinGame (username) {
    if (this.players.find(player => player.username === username)) {
      this.casinoBot.bot.tell(username, 'You have already joined the lobby!')
      return
    }
    if (this.players.length >= 2) {
      this.casinoBot.bot.tell(username, 'The lobby is full!')
      return
    }

    const uuid = await jsonManager.getUUID(username, this.casinoBot.gamemode)

    this.players.push({ username, uuid, state: 'spectating' })

    this.casinoBot.bot.tell(username, 'You have joined the lobby!')
    this.casinoBot.bot.tell(username, 'Type \'/r exit\' to leave the lobby.')
  }

  async startGame () {
    this.multiplier = 0
    this.crashPoint = 1

    if (this.gameTimeout) clearTimeout(this.gameTimeout)
    this.gameTimeout = setTimeout(async () => {
      await this.playGame()
      await this.startGame()
    }, 10000)
  }

  async playGame () {
    this.crashPoint = Crash.getCrashPoint()
    this.multiplier = 1

    for (const player of this.players) {
      player.user = await jsonManager.getUserFromUUID(player.uuid, this.casinoBot.gamemode)
      player.winnings = 0
      if (player.state !== 'joining') {
        player.state = 'spectating'
      }

      this.casinoBot.bot.tell(player.username, '---------------------------')
      if (player.state === 'joining') {
        if (player.user.bet > player.user.balance) {
          this.casinoBot.bot.tell(player.username, 'You can\'t afford the bet!')
          player.state = 'spectating'
          continue
        }

        player.state = 'playing'

        casinoManager.setUserStatus(player.username, 'crash')
        this.casinoBot.bot.tell(player.username, 'YOU ARE PLAYING THIS ROUND')

        const user = await jsonManager.getUserFromUUID(player.uuid, this.casinoBot.gamemode)

        this.casinoBot.log(`${player.username} is playing crash with a bet of ${user.bet}`)
        this.casinoBot.log(`The crash point will be ${this.crashPoint}`)

        await jsonManager.editUser(player.username, 'subtract', 'balance', user.bet, this.casinoBot.gamemode)
        await jsonManager.editUser(player.username, 'add', 'loss', user.bet, this.casinoBot.gamemode)
        await jsonManager.editUser(player.username, 'add', 'crashGames', 1, this.casinoBot.gamemode)
        await jsonManager.editUser(player.username, 'add', 'crashLoss', user.bet, this.casinoBot.gamemode)
      } else {
        this.casinoBot.bot.tell(player.username, 'YOU ARE SPECTATING THIS ROUND')
      }
      this.casinoBot.bot.tell(player.username, '---------------------------')
    }

    let i = 1
    while (i < this.crashPoint) { // real
      const randomHundredth = Math.random() / 10
      const potentialMultiplier = i + randomHundredth

      if (potentialMultiplier >= this.crashPoint) {
        this.multiplier = this.crashPoint
      } else {
        this.multiplier = potentialMultiplier
      }

      for (const player of this.players) {
        const user = await jsonManager.getUserFromUUID(player.uuid, this.casinoBot.gamemode)

        if (player.state === 'playing') {
          player.winnings = Math.floor(user.bet * this.multiplier) //
          this.casinoBot.bot.tell(player.username, `${this.multiplier.toFixed(2)}x → $${Math.floor(player.winnings).toLocaleString('en-US')}`)
        } else if (player.state === 'claimed') {
          this.casinoBot.bot.tell(player.username, `${this.multiplier.toFixed(2)}x | $${Math.floor(player.winnings).toLocaleString('en-US')} Claimed!`)
        } else if (player.state === 'spectating' || player.state === 'joining') {
          this.casinoBot.bot.tell(player.username, `${this.multiplier.toFixed(2)}x | Could've won $${(Math.floor(user.bet * this.multiplier).toLocaleString('en-US'))}`)
        }
      }

      i += 0.2
      await sleep(1200 / Math.pow(i, 0.75))
    }

    if (this.crashPoint < 1) this.crashPoint = 1 + Math.random() / 10

    this.multiplier = 0

    for (const player of this.players) { // payouts
      const user = await jsonManager.getUserFromUUID(player.uuid, this.casinoBot.gamemode)

      if (player.state === 'playing' || player.state === 'claimed') {
        casinoManager.setUserFree(player.username)
      }
      if (player.state === 'playing') { // no claim
        this.casinoBot.log(`${player.username} lost crash | $${user.bet}`)
        player.state = 'spectating'
      }
      this.casinoBot.bot.tell(player.username, `${this.crashPoint.toFixed(2)}x | ❌ CRASHED! ❌`)
      if (player.state === 'claimed') {
        if (this.crashPoint >= 1) {
          player.state = 'spectating'

          await jsonManager.editUser(player.username, 'add', 'gains', player.winnings, this.casinoBot.gamemode)
          await jsonManager.editUser(player.username, 'add', 'balance', player.winnings, this.casinoBot.gamemode)
          await jsonManager.editUser(player.username, 'add', 'crashGains', player.winning, this.casinoBot.gamemode)

          this.casinoBot.log(`${player.username} won crash | $${user.bet.toLocaleString('en-US')} * ${(player.winnings / user.bet).toFixed(2)} = $${player.winnings}`)
          this.casinoBot.bot.tell('150cc', `${player.username} won crash | $${user.bet.toLocaleString('en-US')} * ${(player.winnings / user.bet).toFixed(2)} $${player.winnings}`)

          this.casinoBot.bot.tell(player.username, `Could've won $${(this.crashPoint * user.bet).toLocaleString('en-US')}!`)
        }

        for (const other of this.players) {
          if (other.winnings > 0) this.casinoBot.bot.tell(player.username, `${other.username} won $${other.winnings.toLocaleString('en-US')}!`)
        }
      }
      this.casinoBot.bot.tell(player.username, '---------------------------')

      this.casinoBot.bot.tell(player.username, 'Next game in 10 seconds!')
      if (player.state === 'spectating') {
        this.casinoBot.bot.tell(player.username, '\'/r play\' to join next round!')
      } else if (player.state === 'joining') {
        this.casinoBot.bot.tell(player.username, 'You are playing this round!')
        this.casinoBot.bot.tell(player.username, 'Type \'/r claim\' to before the crash!')
      }

      this.casinoBot.bot.tell(player.username, '---------------------------')

      setTimeout(() => this.casinoBot.bot.tell(player.username, '3'), 7000)
      setTimeout(() => this.casinoBot.bot.tell(player.username, '2'), 8000)
      setTimeout(() => this.casinoBot.bot.tell(player.username, '1...'), 9000)
    }
  }
  // add first time crash game disclaimer
}
