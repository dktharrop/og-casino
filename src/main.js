// init
import matchCommands from './command-manager.js'
import dotenv from 'dotenv'
import mineflayer from 'mineflayer'

dotenv.config()

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const devMode = true

initBot()

// Init bot instance
function initBot () {
  const bot = mineflayer.createBot(
    {
      username: process.env.USERNAME,
      auth: 'microsoft',
      host: 'og-network.net',
      port: '25565',
      version: '1.20',
      viewDistance: 3,
      autoJoinSMP: true,
      busy: false,
      hideErrors: true,
    })

  initEvents(bot)
}

function initEvents (bot) {
  bot.on('inject_allowed', () => {
  })

  bot.on('login', () => {
    const botSocket = bot._client.socket
    console.log(`[${bot.username}] Logged in to ${botSocket.server ? botSocket.server : botSocket._host}`)
  })

  bot.on('spawn', async () => {
    console.log(`[${bot.username}] Spawned in at ${bot.entity.position.x}, ${bot.entity.position.y}, ${bot.entity.position.z}`)

    joinSMP(bot)
  })

  bot.on('end', (reason) => {
    console.log(`[${bot.username}] Disconnected: ${reason}`)

    if (reason === 'disconnect.quitting') {
      return
    }

    // attempt reconnect
    setTimeout(() => initBot(), 5000)
  })

  bot.on('error', (err) => {
    if (err.cide === 'ECONNREFUSED') {
      console.log(`[${bot.username}] Failed to connect to ${err.address}:${err.port}`)
    } else {
      console.log(`[${bot.username}] Unhandled error: ${err}`)
    }
  })

  bot.on('message', (jsonMsg) => {
    matchCommands(bot, jsonMsg)
  })
}

async function joinSMP (bot) {
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
