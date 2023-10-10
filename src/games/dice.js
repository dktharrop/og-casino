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
  const user = await jsonManager.getUser(username)

  if (user.balance >= user.bet && user.balance > 0) {
    console.log(`${username} rolling dice with a bet of $${user.bet}`)
    await jsonManager.editUser(username, 'subtract', 'balance', user.bet)
    await jsonManager.editUser(username, 'add', 'loss', user.bet)

    for (let i = rollCount; i > 0; i--) {
      bot.whisper(username, '|  ?  |')
      await waitRatio(i)
    }
    let result = symbols[Math.floor(Math.random() * symbols.length)]

    bot.whisper(username, `- ${result} -`)

    let winnings = 0
    if (result === guess) {
      winnings = user.bet * 4
      bot.whisper(username, '⭐ You win!! 4x multiplier! ⭐')
    } else {
      bot.whisper(username, 'You lost... ☹ Try again?')
      console.log(`${username} lost $${user.bet} | ${result} | ${guess}`)
    }
    if (winnings > 0) {
      await jsonManager.editUser(username, 'add', 'balance', winnings)
      await jsonManager.editUser(username, 'add', 'gains', winnings)
      bot.whisper(username, `$${winnings} has been added to your account`)
      bot.whisper(devName, `${username} won $${winnings} | ${result} | ${guess} |`)
      console.log(`${username} won $${winnings} | ${result} | ${guess} |`)
    }
  } else {
    bot.chat(`/msg ${username} You can't afford the bet!`)
    bot.chat(`/msg ${username} Please lower the bet or /pay the bot to add funds`)
    bot.chat(`/msg ${username} You can check your balance with $bal, and bet with $bet`)
  }
}
