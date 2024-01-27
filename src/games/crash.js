import * as jsonManager from '../json-manager.js'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default class Crash {
  static players = [] // add max players per bot = 2

  static crashPoint = 1
  static multiplier = 0
  static gameInterval = null

  static getCrashPoint () {
    const r = Math.random()

    const e = 2 ** 32
    const h = r * e

    if (r < 0.08*1000) return 0 // 8% chance of immediate crash
    const crashPoint = Math.floor((100 * e - h) / (e - h)) / 100
    if (crashPoint > 50) return (50 + (10 * Math.random()))
    return (crashPoint < 1) ? (crashPoint + 0.5 * (1 - crashPoint) + 0.5) : crashPoint
  }

  static async joinGame (bot, username) {
    if (this.players.find(player => player.username === username)) {
      bot.tell(username, 'You have already joined the lobby!')
      return
    }
    if (this.players.length >= 2) {
      bot.tell(username, 'The lobby is full!')
      return
    }

    const user = await jsonManager.getUser(username)
    this.players.push({ user, username, state: 'spectating' }) // change to just bet instead of whole user?

    bot.tell(username, 'You have joined the lobby!')
    bot.tell(username, 'Type \'/w exit\' to leave the lobby.')
  }

  static async startGame (bot) {
    this.multiplier = 0
    this.crashPoint = 1

    // await playGame (bot)

    if (this.gameTimeout) clearTimeout(this.gameTimeout)
    this.gameTimeout = setTimeout(async () => {
      await Crash.playGame(bot)
      await Crash.startGame(bot)

      // for (const player of this.players) {

      // }
    }, 10000)
  }

  static async playGame (bot) {
    this.crashPoint = Crash.getCrashPoint()
    this.multiplier = 1
    // const user = await jsonManager.getUser(username)

    for (const player of this.players) {
      player.user = await jsonManager.getUser(player.username)
      player.winnings = 0
      if (player.state !== 'joining') {
        player.state = 'spectating'
      }

      bot.tell(player.username, '---------------------------')
      if (player.state === 'joining') {
        player.state = 'playing'
        bot.tell(player.username, 'YOU ARE PLAYING THIS ROUND')

        console.log(`${player.username} is playing crash with a bet of ${player.user.bet}`)
        console.log(`The crash point will be ${this.crashPoint}`)

        await jsonManager.editUser(player.username, 'subtract', 'balance', player.user.bet)
        await jsonManager.editUser(player.username, 'add', 'loss', player.user.bet)
        await jsonManager.editUser(player.username, 'add', 'crashGames', 1)
        await jsonManager.editUser(player.username, 'add', 'crashLoss', player.user.bet)
      } else {
        bot.tell(player.username, 'YOU ARE SPECTATING THIS ROUND')
      }
      bot.tell(player.username, '---------------------------')
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
        if (player.state === 'playing') {
          player.winnings = Math.floor(player.user.bet * this.multiplier) //
          bot.tell(player.username, `${this.multiplier.toFixed(2)}x → $${Math.floor(player.winnings.toLocaleString('en-US'))}`)
        } else if (player.state === 'claimed') {
          bot.tell(player.username, `${this.multiplier.toFixed(2)}x | $${Math.floor(player.winnings.toLocaleString('en-US'))} Claimed! Could've won $${Math.floor(player.user.bet * this.multiplier).toLocaleString('en-US')}`)
        } else if (player.state === 'spectating' || player.state === 'joining') {
          bot.tell(player.username, `${this.multiplier.toFixed(2)}x | Could've won $${(Math.floor(player.user.bet * this.multiplier).toLocaleString('en-US'))}`)
        }
      }

      i += 0.2
      await sleep(1200 / Math.pow(i, 0.75))
    }

    if (this.crashPoint < 1) this.crashPoint = 1 + Math.random() / 10

    this.multiplier = 0

    for (const player of this.players) { // payouts
      if (player.state === 'playing') { // no claim
        console.log(`${player.username} lost crash | $${player.user.bet}`)
        player.state = 'spectating'
      }
      bot.tell(player.username, `${this.crashPoint.toFixed(2)}x | ❌ CRASHED! ❌`)
      if (player.state === 'claimed') {
        if (this.crashPoint >= 1) {
          player.state = 'spectating'
          await jsonManager.editUser(player.username, 'add', 'gains', player.winnings)
          await jsonManager.editUser(player.username, 'add', 'balance', player.winnings)
          await jsonManager.editUser(player.username, 'add', 'crashGains', player.winnings)

          console.log(`${player.username} won crash | $${player.user.bet} * ${(player.winnings / player.user.bet).toFixed(2)} = $${player.winnings}`)
          bot.tell('150cc', `${player.username} won crash | $${player.user.bet} * ${(player.winnings / player.user.bet).toFixed(2)} $${player.winnings}`)
        }

        for (const other of this.players) {
          if (other.winnings > 0) bot.tell(player.username, `${other.username} won $${other.winnings.toLocaleString('en-US')}!`)
        }
      }
      bot.tell(player.username, '---------------------------')

      bot.tell(player.username, 'Next game in 10 seconds!')
      if (player.state === 'spectating') {
        bot.tell(player.username, 'Type \'/r play\' to join next round!')
      } else if (player.state === 'joining') {
        bot.tell(player.username, 'You are playing this round!')
        bot.tell(player.username, 'Type \'/r claim\' to before the crash!')
      }

      bot.tell(player.username, '---------------------------')

      setTimeout(() => bot.tell(player.username, '3'), 7000)
      setTimeout(() => bot.tell(player.username, '2'), 8000)
      setTimeout(() => bot.tell(player.username, '1...'), 9000)
    }
  }
  // add first time crash game disclaimer
}
