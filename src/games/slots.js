import * as userManager from '../user-manager.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitRatio (x) {
  const k = 800
  const ms = k / Math.pow(x, 2 / (1 + Math.sqrt(5)))

  await sleep(ms)
}

function randomIndex (list, currentSymbol) {
  // if (currentSymbol === '⭐') {
  //   return Math.floor(Math.random() * (list.length - 1))
  // } else {
  //   return Math.floor(Math.random() * list.length)
  // }
  return Math.floor(Math.random() * list.length)
}

export default async function slots (bot, username) {
  const symbols = ['🗡', '🏹', '🪓', '🔱', '🍖', '⭐']
  const rollCount = Math.ceil(Math.random() * 16) + 32
  const user = await userManager.getUser(username)
  const result = []

  if (user.balance >= user.bet && user.balance > 0) {
    console.log(`${username} rolling slots with a bet of $${user.bet}`)
    await userManager.editUser(username, 'subtract', 'balance', user.bet)
    await userManager.editUser(username, 'add', 'loss', user.bet)

    bot.whisper(username, '------')

    let lastStarIndex = -1
    for (let i = rollCount; i > 0; i--) {
      if (i < rollCount / 4) {
        result[2] = symbols[randomIndex(symbols, result[2])]

        if (result[0] === result[1]) {
          i = (Math.random() < 0.5) ? i + 1 : i
          while (result[2] === result[1])
          result[2] = symbols[randomIndex(symbols, result[2])]
        }
      } else if (i < rollCount / 2) {
        result[2] = symbols[randomIndex(symbols, result[2])]
        result[1] = symbols[randomIndex(symbols, result[1])]
      } else {
        result[2] = symbols[randomIndex(symbols, result[2])]
        result[1] = symbols[randomIndex(symbols, result[1])]
        result[0] = symbols[randomIndex(symbols, result[0])]
      }

      bot.whisper(username, `${result.join(' ')}`)
      bot.whisper(username, '------')
      await waitRatio(i)
    }
    let winnings = 0
    if (result[0] === result[1] && result[0] === result[2]) {
      if (result[1] === '⭐') {
        winnings = user.bet * 20
        bot.whisper(username, '⭐ JACKPOT!! 20x winnings! ⭐')
      } else {
        winnings = user.bet * 10
        bot.whisper(username, `3 in a row! 10x multiplier!`)
      }
    } else if (result[0] == result[1] || result[1] == result[2]) {
      if (result[1] === '⭐') {
        winnings = user.bet * 5
        bot.whisper(username, 'Semi-jackpot! 5x bonus!')
      } else {
        winnings = user.bet
        bot.whisper(username, '2 in a row!')
      }
    } else if (result[0] === '⭐' || result[1] === '⭐' || result[2] === '⭐') {
      winnings = Math.floor(user.bet / 2)
      bot.whisper(username, '1 star. (not in a row) Try again?')
    } else {
      bot.whisper(username, 'You lost... ☹ Try again?')
      console.log(`${username} lost $${user.bet} | ${result.join(' ')}`)
    }
    if (winnings > 0) {
      await userManager.editUser(username, 'add', 'balance', winnings)
      await userManager.editUser(username, 'add', 'gains', winnings)
      bot.whisper(username, `$${winnings} has been added to your account`)
      bot.whisper('150cc', `${username} won $${winnings} | ${result.join(' ')}`)
      console.log(`${username} won $${winnings} (net of ${winnings - user.bet}) | ${result.join(' ')}`)
    }
  } else {
    bot.chat(`/msg ${username} You can't afford the bet!`)
    bot.chat(`/msg ${username} Please lower the bet or /pay the bot to add funds`)
    bot.chat(`/msg ${username} You can check your balance with -bal, and bet with -bet`)
  }
}
