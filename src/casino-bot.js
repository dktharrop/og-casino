import mineflayer from 'mineflayer'
// import readline from 'readline'
import * as commandHandler from './command-handler.js'
import * as userManager from './user-manager.js' // only for hotfix, remove later

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default class CasinoBot {
  // Constructor
  constructor (botArgs) {
    this.bot = mineflayer.createBot({
      username: botArgs.username,
      // password: botArgs.password,
      auth: botArgs.auth,
      host: botArgs.host,
      port: botArgs.port,
      version: botArgs.version,
      viewDistance: botArgs.viewDistance,
      hideErrors: botArgs.hideErrors,
    })
    this.initEvents(this.bot)
  }

  initEvents (bot) {
    // rl.on('line', (input) => {
    //   bot.chat(input)
    // })

    bot.on('login', () => {
      const botSocket = bot._client.socket
      console.log(`[${bot.username}] Logged in to ${botSocket.server ? botSocket.server : botSocket._host}`)
    })

    bot.on('spawn', async () => {
      console.log(`[${bot.username}] Spawned in at ${bot.entity.position.x}, ${bot.entity.position.y}, ${bot.entity.position.z}`)

      this.joinSMP(bot)
    })

    bot.on('end', (reason) => {
      console.log(`[${bot.username}] Disconnected: ${reason}`)

      if (reason === 'disconnect.quitting') {
        return
      }

      // attempt reconnect
      // setTimeout(() => initBot(), 5000)
    })

    bot.on('error', (err) => {
      if (err.cide === 'ECONNREFUSED') {
        console.log(`[${bot.username}] Failed to connect to ${err.address}:${err.port}`)
      } else {
        console.log(`[${bot.username}] Unhandled error: ${err}`)
      }
    })

    bot.on('message', (jsonMsg) => {
      const rawMsg = jsonMsg.toString()
      const message = this.getMessage(rawMsg) // returns either type whisper or message
      const command = (message) ? commandHandler.parseCommand(message.username, message.content, message.type) : false
      if (command !== 'invalid' && command !== false && message.type === 'whisper'/* || message.type === 'payment'*/ && !message.username.match(/^\*/)) {

        commandHandler.enqueueCommand(bot, command.commandName, command.commandArgs)
      } else if (message.type === 'whisper' && message.content.match(/^\$/) && !message.username.match(/^\*/)) {
        bot.whisper(message.username, 'Invalid command! Use $help for a list of commands.')
      } else if (message !== undefined && message.type === 'whisper' && message.username.match(/^\*/)) {
        bot.whisper(message.username, 'Sorry! Bedrock players can\'t use the bot right now...')
        bot.whisper(message.username, 'This is because bedrock playres don\'t have java UUIDs, so I can\'t store their data properly')
        bot.whisper(message.username, 'Addotonally, bedrock does not properly display the emoji used by the bot')
        console.log(`${message.username} just learned that bedrockers are second class citizens...`)
      } else if (message.type === 'payment') { // fix this
        this.makePayment(bot, message.username, message.content)
      }
    })
  }

  async joinSMP (bot) {
    await sleep(1000)
    bot.activateItem(false) // right click the compass
    bot.on('windowOpen', (window) => {
      const items = window.containerItems()

      for (let i = 0; i < items.length; i++) {
        if (items[i].type === 14) { // grass block
          bot.clickWindow(items[i].slot, 1, 0)
          bot.closeWindow(window)
        }
      }
    })
  }

  getMessage(input) { // fix this
    const chatMatch = input.match(/^\[[^\]]+\](?:.*?)? ✪?\[[^\]]+\] ([^:]+): (.+)$/)
    const whisperMatch = input.match(/^From ✪?\[[^\]]+\] ([^:]+): (.+)\s*$/)
    const payMatch = input.match(/\$(\d{1,3}(?:,\d{3})*) has been received from ✪?\[[^\]]+\] (.+)\.$/)

    if (chatMatch) {
      return {
        username: chatMatch[1], 
        content: chatMatch[2],
        type: 'chat'
      }
    } else if (whisperMatch) {
      console.log(input)
      return {
        username: whisperMatch[1], 
        content: whisperMatch[2],
        type: 'whisper'
      }
    } else if (payMatch) { // fix this later
      const payment = payMatch[1]
      return {
        username: payMatch[2],
        content: parseInt(payment.replace(/[^0-9]/g, '')),
        type: 'payment'
      }
    }
    return false
  }
  async makePayment(bot, username, payment) {
    if (payment > 0) {
      await userManager.editUser(username, 'add', 'balance', payment)
      bot.whisper(username, `$${payment} has been added to your account`)
      console.log(`${username} added $${payment} to their account`)
    } else {
      bot.whisper(username, 'Please enter a valid payment!')
    }
  }
}
