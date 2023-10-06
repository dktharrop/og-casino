import mineflayer from 'mineflayer'
import tokens from 'prismarine-tokens'
import readline from 'readline'
import dotenv from 'dotenv'

dotenv.config()

const account = JSON.parse(process.env.ACCOUNTS)[2]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const options = {
  username: account.username,
  password: account.password,
  auth: 'microsoft',
  host: 'og-network.net',
  port: '25565',
  version: '1.20',
  viewDistance: 3,
  hideErrors: false,
  tokensLocation: '../bot_tokens.json',
  //Set to true if you want debug informations
  tokensDebug: false
}

startBot(options)

function startBot(options) {
  const testBot = mineflayer.createBot(options)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  initEvents(testBot, rl)
}

function initEvents (testBot, rl) {
  testBot.on('login', () => {
    const testBotSocket = testBot._client.socket
    console.log(`[${testBot.username}] Logged in to ${testBotSocket.server ? testBotSocket.server : testBotSocket._host}`)
  })

  testBot.on('spawn', async () => {
    console.log(`[${testBot.username}] Spawned in at ${testBot.entity.position.x}, ${testBot.entity.position.y}, ${testBot.entity.position.z}`)

    joinSMP(testBot)
  })

  testBot.on('end', (reason) => {
    console.log(`[${testBot.username}] Disconnected: ${reason}`)

    if (reason === 'disconnect.quitting') {
      return
    }

    setTimeout(() => initBot(), 5000)
  })

  testBot.on('error', (err) => {
    if (err.cide === 'ECONNREFUSED') {
      console.log(`[${testBot.username}] Failed to connect to ${err.address}:${err.port}`)
    } else {
      console.log(`[${testBot.username}] Unhandled error: ${err}`)
    }
  })

  testBot.on('message', (jsonMsg) => {
    const rawMsg = jsonMsg.toString()
    console.log(rawMsg)
  })
  rl.on('line', (input) => {
    testBot.chat(input)
  })
}

async function joinSMP (testBot) {
  await sleep(1000)
  testBot.activateItem(false) // right click the compass
  testBot.on('windowOpen', (window) => {
    const items = window.containerItems()

    for (let i = 0; i < items.length; i++) {
      if (items[i].type === 14) { // grass block
        testBot.clickWindow(items[i].slot, 1, 0)
        testBot.closeWindow(window)
      }
    }
  })
}
