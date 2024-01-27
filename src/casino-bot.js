import mineflayer from 'mineflayer'
import readline from 'readline'
import * as commandHandler from './command-handler.js'
import * as jsonManager from './json-manager.js' // only for hotfix, remove later
import casinoManager from './main.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default class CasinoBot {
  // Constructor
  constructor (botArgs) {
    const botOptions = {
      username: botArgs.username,
      auth: botArgs.auth,
      host: botArgs.host,
      port: botArgs.port,
      version: botArgs.version,
      viewDistance: botArgs.viewDistance,
      hideErrors: botArgs.hideErrors
    }
    if (botArgs.password) {
      botOptions.password = botArgs.password
    }

    this.bot = mineflayer.createBot(botOptions)
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    this.bot.tell = (username, message) => {
      this.bot.whisper(username, `| ${message}`)
    }

    this.botArgs = botArgs
    // this.initEvents(this.bot, this.rl)
  }

  init () {
    this.rl.on('line', (input) => {
      this.bot.chat(input)
    })

    this.bot.on('login', () => {
      const botSocket = this.bot._client.socket
      console.log(`[${this.bot.username}] Logged in to ${botSocket.server ? botSocket.server : botSocket._host}`)
    })

    this.bot.on('spawn', async () => {
      console.log(`[${this.bot.username}] Spawned in at ${this.bot.entity.position.x}, ${this.bot.entity.position.y}, ${this.bot.entity.position.z}`)
      this.joinSMP(this.bot)
    })

    this.bot.on('end', (reason) => {
      console.log(`[${this.bot.username}] Disconnected: ${reason}`)

      if (reason === 'disconnect.quitting') {
        console.log(`[${this.bot.username}] Quitting...`)
      }
    })

    this.bot.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log(`[${this.bot.username}] Failed to connect to ${err.address}:${err.port}`)
      } else if (err.details?.reason === 'UNAUTHORIZED') {
        this.botArgs.password = undefined
        this.bot.end()
      } else {
        console.log(`[${this.bot.username}] Unhandled error: ${err}`)
      }
      casinoManager.stopBot(0)
      setTimeout(() => casinoManager.startBot(this.botArgs), 5000)
    })

    this.bot.on('message', (jsonMsg) => {
      // const rawMsg = jsonMsg.toString()
      this.parseMessage(jsonMsg)
    })

    this.bot.on('chat', (username, message) => {
      //
    })

    this.bot.on('tell', (username, message) => { // why message.username?
      if (username.match(/^\*/)) {
        this.bot.tell(username, 'Sorry! Bedrock players can\'t use the bot right now...')
        this.bot.tell(username, 'This is because bedrock playres don\'t have java UUIDs, so I can\'t store their data properly')
        this.bot.tell(username, 'Addotonally, bedrock does not properly display the emoji used by the bot')
        console.log(`${username} just learned that bedrockers are second class citizens...`)
      } else if (message.match(/^-|^\/|^!|^&|^#/)) {
        this.bot.tell(username, 'Invalid prefix! Use \'$\' to run commands. For example:')
        this.bot.tell(username, '/msg VegasCasino1 $help')
      }

      const crashPlayer = casinoManager.games.crash.players.find(player => player.username === username)
      if (crashPlayer) {
        if (message === 'p' || message.match(/play/)) {
          if (crashPlayer.user.balance < crashPlayer.user.bet) {
            this.bot.tell(username, 'You can\'t afford the bet!')
            return
          }
          if (crashPlayer.state === 'spectating') {
            crashPlayer.state = 'joining'
            this.bot.tell(username, 'You are now playing the next round!')
          } else {
            this.bot.tell(username, 'You are already playing this round!')
          }
        }
        if (message === 'l' || message.match(/leave/)) {
          if (crashPlayer.state === 'playing' && casinoManager.games.crash.multiplier === 0) {
            crashPlayer.state = 'spectating'
            this.bot.tell(username, 'You are now spectating the next round!')
          } else if (crashPlayer.state === 'playing' && casinoManager.games.crash.multiplier > 0) {
            this.bot.tell(username, 'You can\'t leave the game after it has started!')
          } else {
            this.bot.tell(username, 'You are already spectating!')
            this.bot.tell(username, 'Type \'/r exit\' to leave the lobby!')
          }
        }
        if (message === 'e' || message.match(/exit/)) { // create methods for thsee things
          this.bot.tell(username, 'You have stopped playing!')
          casinoManager.games.crash.players = casinoManager.games.crash.players.filter(player => player.username !== username) // and this thing
        }
        if (message === 'c' || message.match(/claim/)) {
          if (crashPlayer.state === 'joining') {
            this.bot.tell(username, 'The game hasn\'t started yet!')
          } else if (crashPlayer.state !== 'playing') {
            this.bot.tell(username, 'You are not playing this round!')
          } else {
            crashPlayer.state = 'claimed'
          }
        }
      }
    })

    this.bot.on('payment', (username, payment) => {
      this.makePayment(username, payment)
    })

    this.bot.on('command', (commandName, commandArgs) => {
      if (commandName !== 'invalid' && !commandArgs[0].match(/^\*/)) {
        console.log(`Command $${commandName} run | ${commandArgs}`)
        commandHandler.enqueueCommand(this.bot, commandName, commandArgs)
      }
    })
  }

  async joinSMP () {
    await sleep(1000)
    this.bot.activateItem(false) // right click the compass
    this.bot.on('windowOpen', (window) => {
      const items = window.containerItems()

      for (let i = 0; i < items.length; i++) {
        if (items[i].type === 14) { // grass block
          this.bot.clickWindow(items[i].slot, 1, 0)
          this.bot.closeWindow(window)
        }
      }
    })
  }

  parseMessage (jsonMsg) {
    const rawMsg = jsonMsg.toString()

    const commandMatch = rawMsg.match(/^From ✪?\[[^\]]+\] ([^:]+): \$(.+)\s*$/)
    const chatMatch = rawMsg.match(/^\[[^\]]+\](?:.*?)? ✪?\[[^\]]+\] ([^:]+): (.+)$/)
    const tellMatch = rawMsg.match(/^From ✪?\[[^\]]+\] ([^:]+): (.+)\s*$/)
    const payMatch = rawMsg.match(/\$(\d{1,3}(?:,\d{3})*) has been received from ✪?\[[^\]]+\] (.+)\.$/)

    // unhandled
    let event = 'unhandled'
    let username = '?'
    let content = rawMsg

    if (chatMatch) {
      event = 'chat'
      username = chatMatch[1]
      content = chatMatch[2]
    } else if (tellMatch) {
      console.log(rawMsg)
      event = 'tell'
      username = tellMatch[1]
      content = tellMatch[2]
    } else if (payMatch && !jsonMsg.json.clickEvent) { // fix this later
      const payment = payMatch[1]

      event = 'payment'
      username = payMatch[2]
      content = parseInt(payment.replace(/[^0-9]/g, ''))
    }
    if (event !== 'unhandled') this.bot.emit(event, username, content) // trim spaces

    if (commandMatch) {
      const commandName = commandMatch[2].split(' ')[0].trim()
      const commandArgs = commandMatch[2].split(' ').filter(arg => arg !== '')
      commandArgs[0] = commandMatch[1]

      if (commandHandler.getCommand(commandName) === undefined) {
        this.bot.emit('command', 'invalid')
      } else {
        this.bot.emit('command', commandName, commandArgs)
      }
    }
  }
  // emit crash event in command handler grin emoji

  async makePayment (username, payment) {
    if (payment > 0) {
      await jsonManager.editUser(username, 'add', 'balance', payment)
      await jsonManager.editUser(username, 'add', 'paymentsSinceLastUpdate', payment)
      this.bot.tell(username, `$${payment} has been added to your account`)
      console.log(`${username} added $${payment} to their account`)
    } else {
      this.bot.tell(username, 'Please enter a valid payment!')
    }
  }
}
