import * as jsonManager from '../json-manager.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitRatio (x) {
  const k = 800
  const ms = k / Math.pow(x, 2 / (1 + Math.sqrt(5)))

  await sleep(ms)
}

export default async function dice (bot, username, guessInt, devName) {
  const symbols = [ '⚀','⚁','⚂','⚃','⚄','⚅' ]
  const guess = symbols[guessInt - 1]
  const rollCount = Math.ceil(Math.random() * 5) + 1

    for (let i = rollCount; i > 0; i--) {
      bot.whisper(username, '|  ?  |')
      await waitRatio(i)
    }

    let roll = symbols[Math.floor(Math.random() * symbols.length)]

    bot.whisper(username, `- ${roll} -`)

    return { roll, guess }
}
