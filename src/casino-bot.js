import mineflayer from 'mineflayer'
import readline from 'readline'
import * as commandHandler from './command-handler.js'
import * as jsonManager from './json-manager.js' // only for hotfix, remove later
import casinoManager from './main.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default class CasinoBot {
  // Constructor
  constructor (botArgs) {
    this.bot = mineflayer.createBot(botArgs)

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    this.bot.tell = async (username, message) => {
      // Store for rate limiting
      this.rateLimitStore = this.rateLimitStore || {}

      const now = Date.now()
      const lastMessageInfo = this.rateLimitStore[username] || { time: 0, count: 0, warned: false }
      const timeSinceLastMessage = now - lastMessageInfo.time

      // If the user has received 100 messages in the last second, ignore the message
      if (timeSinceLastMessage < 1000 && lastMessageInfo.count >= 200) {
        if (!lastMessageInfo.warned) {
          this.log(`Rate limit exceeded for user ${username}. Ignoring subsequent messages for 1 second.`)
          this.bot.whisper(username, '| Rate limit exceeded. Ignoring subsequent messages for 1 second.')
          lastMessageInfo.warned = true
        }
        return
      }

      // If it's been more than a second since the last message, reset the count and the warning flag
      if (timeSinceLastMessage >= 1000) {
        lastMessageInfo.count = 0
        lastMessageInfo.warned = false
      }

      // Update the last message time and increment the count for the user
      lastMessageInfo.time = now
      lastMessageInfo.count++

      this.rateLimitStore[username] = lastMessageInfo

      this.bot.whisper(username, `| ${message}`)
    }
  }

  async init () {
    this.rl.on('line', (input) => {
      this.bot.chat(input)
    })

    this.bot.on('login', () => {
      const botSocket = this.bot._client.socket
      this.log(`Logged in to ${botSocket.server ? botSocket.server : botSocket._host}`)
    })

    this.bot.on('spawn', async () => {
      this.log(`Spawned in at ${this.bot.entity.position.x}, ${this.bot.entity.position.y}, ${this.bot.entity.position.z}`)

      this.gamemode = 'unknown'

      await sleep(1000)

      if (this.bot.game.height === 256) {
        this.gamemode = 'hub'
      } else if (this.bot.game.height === 384) {
        let itemName = this.bot.inventory?.slots[9]?.customName
        if (itemName) {
          itemName = JSON.parse(itemName)
        } else {
          console.error('The ninth slot is empty')
        }

        if ('extra' in itemName) {
          this.gamemode = itemName.extra[0].text
        }

        if ('text' in itemName) {
          this.gamemode = itemName.text
        }
      }
      this.log(`Joined gamemode: ${this.gamemode}`)

      if (this.bot.username === 'VegasCasino3' || this.bot.username === '200cc') {
        this.joinGamemode('rpg')
      } else {
        this.joinGamemode('smp')
      }
    })

    this.bot.on('end', (reason) => {
      this.log(`[${this.bot.username}] Disconnected: ${reason}`)

      if (reason === 'disconnect.quitting') {
        this.log(`[${this.bot.username}] Quitting...`)
      }
    })

    this.bot.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        this.log(`[${this.bot.username}] Failed to connect to ${err.address}:${err.port}`)
      } else if (err.details?.reason === 'UNAUTHORIZED') {
        this.botArgs.password = undefined
        this.bot.end()
      } else {
        this.log(`[${this.bot.username}] Unhandled error: ${err}`)
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

    this.bot.on('tell', (username, message, origin) => {
      if (origin !== this.gamemode) {
        this.bot.tell(username, 'Wrong server!')
        this.bot.tell(username, `Current location: ${this.gamemode.toUpperCase()}`)
        return
      }

      if (username.match(/^\*/)) {
        this.bot.tell(username, 'Sorry! Bedrock players can\'t use the bot right now...')
        this.bot.tell(username, 'This is because bedrock playres don\'t have java UUIDs, so I can\'t store their data properly')
        this.bot.tell(username, 'Addotonally, bedrock does not properly display the emoji used by the bot')
        this.log(`${username} just learned that bedrockers are second class citizens...`)
      } else if (message.match(/^-|^\/|^!|^&|^#/)) {
        this.bot.tell(username, 'Invalid prefix! Use \'$\' to run commands. For example:')
        this.bot.tell(username, '/msg VegasCasino1 $help')
      }

      const crashPlayer = this.crash?.players.find(player => player.username === username)
      if (crashPlayer) {
        const user = jsonManager.getUserFromUUID(crashPlayer.uuid, this.gamemode)
        if (message === 'p' || message.match(/play/)) {
          if (user.balance < user.bet) {
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
          if (crashPlayer.state === 'playing' && this.crash.multiplier === 0) {
            crashPlayer.state = 'spectating'
            this.bot.tell(username, 'You are now spectating the next round!')
          } else if (crashPlayer.state === 'playing' && this.crash.multiplier > 0) {
            this.bot.tell(username, 'You can\'t leave the game after it has started!')
          } else {
            this.bot.tell(username, 'You are already spectating!')
            this.bot.tell(username, 'Type \'/r exit\' to leave the lobby!')
          }
        }
        if (message === 'e' || message.match(/exit/)) { // create methods for thsee things
          this.bot.tell(username, 'You have stopped playing!')
          this.crash.players = this.crash.players.filter(player => player.username !== username) // and this thing
        }
        if (message === 'c' || message.match(/claim/)) {
          if (crashPlayer.state === 'joining') {
            this.bot.tell(username, 'The game hasn\'t started yet!')
          } else if (crashPlayer.state === 'claimed') {
            this.bot.tell(username, 'You already claimed!')
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

    this.bot.on('command', (commandName, commandArgs, username, origin) => {
      if (origin !== this.gamemode) {
        return
      }

      if (username in casinoManager.activeUsers) {
        if (casinoManager.activeUsers[username].bot !== this.bot.username) {
          this.bot.tell(username, 'You are playing a game!')
          return
        }
      }

      if (commandName !== 'invalid' && !username.match(/^\*/)) {
        this.log(`Command $${commandName} run | ${commandArgs}`)
        commandHandler.enqueueCommand(this, commandName, commandArgs, username)
      }
    })
  }

  async joinGamemode (gamemode) {
    if (gamemode === 'hub') {
      this.bot.chat('/hub')
      return
    }

    // await sleep(1000)

    const grasBlockID = this.bot.registry.itemsByName.grass_block.id
    const enderEyeID = this.bot.registry.itemsByName.ender_eye.id

    const itemID = (gamemode === 'smp') ? grasBlockID : enderEyeID

    this.bot.activateItem(false) // right click the compass
    this.bot.once('windowOpen', (window) => {
      const items = window.containerItems()

      for (let i = 0; i < items.length; i++) {
        if (items[i].type === itemID) { // grass block
          this.bot.clickWindow(items[i].slot, 1, 0)
          this.bot.closeWindow(window)
        }
      }
    })
  }

  parseMessage (jsonMsg) {
    const rawMsg = jsonMsg.toString()

    const commandMatch = rawMsg.match(/^From ✪?\[[^\]]+\] [^:]+: \$(.+)\s*$/)
    const chatMatch = rawMsg.match(/^\[[^\]]+\](?:.*?)? ✪?\[[^\]]+\] ([^:]+): (.+)$/)
    const tellMatch = rawMsg.match(/^From ✪?\[[^\]]+\] ([^:]+): (.+)\s*$/)
    let originMatch

    let origin = 'unknown'

    if (typeof jsonMsg?.json?.extra?.[0]?.hoverEvent?.contents === 'string') {
      originMatch = jsonMsg.json.extra[0].hoverEvent.contents.match(/§7Server: §f([a-zA-Z]*)/)
      if (originMatch) {
        origin = originMatch[1].toLowerCase()
      }
    }

    let payMatch
    if (this.gamemode === 'smp') {
      payMatch = rawMsg.match(/\$(\d{1,3}(?:,\d{3})*) has been received from ✪?\[[^\]]+\] (.+)\.$/)
    } else if (this.gamemode === 'rpg') {
      payMatch = rawMsg.match(/\$(\d{1,3}(?:,\d{3})*) has been received from ✪?(.+)\.$/)
    }

    // unhandled
    let event = 'unhandled'
    let username = '?'
    let content = rawMsg

    if (chatMatch) {
      event = 'chat'
      username = chatMatch[1]
      content = chatMatch[2]
    } else if (tellMatch) {
      event = 'tell'
      username = tellMatch[1]
      content = tellMatch[2]
    } else if (payMatch && !jsonMsg.json.clickEvent) { // fix this later
      const payment = payMatch[1]

      event = 'payment'
      username = payMatch[2]
      content = parseInt(payment.replace(/[^0-9]/g, ''))
    }
    if (event !== 'unhandled') this.bot.emit(event, username, content, origin, jsonMsg) // trim spaces

    if (commandMatch) {
      const commandName = commandMatch[1].split(' ')[0].trim()
      const commandArgs = commandMatch[1].split(' ').filter(arg => arg !== '')
      commandArgs.shift()

      if (commandHandler.getCommand(commandName) === undefined) {
        this.bot.emit('command', 'invalid', [], username, origin)
      } else {
        this.bot.emit('command', commandName, commandArgs, username, origin)
      }
    }
  }

  getBalance () {
    const scoreboard = this.bot.scoreboard
    for (const key in scoreboard['1'].itemsMap) {
      const input = scoreboard['1'].itemsMap[key].displayName.toString()
      const balMatch = input.match(/\$(\d{1,3}(?:,\d{3})*)/)
      if (balMatch) {
        return Math.floor(parseInt(balMatch[1].replace(/[^0-9]/g, '')))
      }
    }
    console.error('Failed to get balance!')
    return false
  }

  async getPing () {
    return new Promise((resolve, reject) => {
      this.bot.chat('/ping')
      this.bot.once('message', (jsonMsg) => {
        const rawMsg = jsonMsg.toString()
        this.log(rawMsg)
        const pingMatch = rawMsg.match(/^\[Ping\] Your ping is (\d+)ms/)
        if (pingMatch) {
          const ping = parseInt(pingMatch[1])
          resolve(ping)
        } else {
          reject(new Error('Ping not found in message'))
        }
      })
    })
  }

  async makePayment (username, payment) {
    if (payment > 0) {
      await jsonManager.editUser(username, 'add', 'balance', payment, this.gamemode)
      await jsonManager.editUser(username, 'add', 'paymentsSinceLastUpdate', payment, this.gamemode)
      this.bot.tell(username, `$${payment} has been added to your account`)
      this.log(`${username} added $${payment} to their account`)
    } else {
      this.bot.tell(username, 'Please enter a valid payment!')
    }
  }

  log (message) {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')

    // Concatenate the date and username with padded spaces
    const formattedDate = `[${date}]`
    const formattedUsername = `[${this.bot.username}]`

    // Set a fixed padding length based on the expected maximum length of the username
    const paddingLength = 14 - formattedUsername.length

    // Ensure paddingLength is not negative
    const padding = paddingLength > 0 ? ' '.repeat(paddingLength) : ''

    console.log(`${formattedDate} ${formattedUsername}${padding} | ${message}`)
  }
}
