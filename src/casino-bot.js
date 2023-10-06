import mineflayer from 'mineflayer'
import * as commandHandler from './command-handler.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default class CasinoBot {
  // Constructor
  constructor (botArgs) {
    this.bot = mineflayer.createBot({
      username: botArgs.username,
      password: botArgs.password,
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
    bot.on('inject_allowed', () => {
    })

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
      if (command !== 'invalid' && command !== false) {
        console.log(command)
        commandHandler.enqueueCommand(bot, command.commandName, command.commandArgs)

        // }
        // DONT UNCOMMENT THIS ITS SO BROKEN (it messages any player who talks in chat)
        // else if (message.content.match(/^\$/)) {
        //   bot.whisper(message.username, 'Please /msg the bot! All bot commands are done through private messages to avoid spam. Confused? Use $help for more info.')
        // }
      } else if (message.type === 'whisper' && message.content.match(/^\$/)) {
        bot.whisper(message.username, 'Invalid command! Use $help for a list of commands.')
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

  getMessage(input) {
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
      return {
        username: whisperMatch[1], 
        content: whisperMatch[2],
        type: 'whisper'
      }
    } else if (payMatch) {
      console.log(payMatch)
      const payment = payMatch[1]
      return {
        username: payMatch[2],
        content: parseInt(payment.replace(/[^0-9]/g, '')),
        type: 'payment'
      }
    }
    return false
  }
}

  // stuff below should be used/fixed/checked/whatever/u know what im talking about

  // function devCheck(bot, username) {
  //   if (devMode === true & username !== '150cc') {
  //     bot.whisper(username, 'This bot is in development mode!')
  //     bot.whisper(username, 'Please use the stable version of the bot by messaging VegasCasino1')
  //     bot.whisper(username, 'Contact 150cc if you think this is an error!')
  //     bot.whisper('150cc', `${username} attempted to access bot in dev mode!`)
  //     return true
  //   } else {
  //     return false
  //   }
  // }

// export default async function matchCommands(bot, jsonMsg) {
//   console.log(bot.queue)
//   const rawMsg = jsonMsg.toString()
//   const chatMsg = getMessage(rawMsg)
//   const whisper = getWhisper(rawMsg)
//   if (!whisper) {
//     getPayment(bot, rawMsg)
//   } else if (devCheck(bot, whisper.username)) {
//     bot.whisper(whisper.username, 'bot is busy! please wait...')
//   } else if (chatMsg) {
//     warningCommand(bot, chatMsg.msgContent, chatMsg.username)
//   } else if (whisper.msgContent.match(/^-/)) {
//     bot.whisper(whisper.username, 'The command prefix has been changed from - to $')
//     bot.whisper(whisper.username, 'Example: \'$help\'')
//   } else if (whisper.username.match(/^\*/)) {
//     bot.whisper(whisper.username, 'Sorry! Bedrock players can\'t use the bot right now...')
//     bot.whisper(whisper.username, 'This is because bedrock playres don\'t have java UUIDs, so I can\'t store their data properly')
//     bot.whisper(whisper.username, 'Addotonally, bedrock does not properly display the emoji used by the bot.')
//     console.log(`${whisper.username} just learned that bedrockers are second class citizens...`)
//   } else if (bot.queue) {
//     balCommand(bot, whisper.msgContent, whisper.username)
//     await baltopCommand(bot, whisper.msgContent, whisper.username)
//     betCommand(bot, whisper.msgContent, whisper.username)
//     coinflipCommand(bot, whisper.msgContent, whisper.username)
//     helpCommand(bot, whisper.msgContent, whisper.username)
//     await profitCommand(bot, whisper.msgContent, whisper.username)
//     await slotsCommand(bot, whisper.msgContent, whisper.username)
//     withdrawCommand(bot, whisper.msgContent, whisper.username)
//   } else if (bot.queue.includes(whisper.username)) {
//     bot.whisper(username, 'Please wait in queue!')
//   } else {
//     bot.whisper(whisper.username, 'Added to queue!')
//   }
// }
