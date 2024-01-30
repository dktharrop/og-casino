import * as jsonManager from '../../json-manager.js'

export default {
  name: 'dice',
  aliases: ['d'],
  description: 'Bet on a 6 sided dice roll',
  skipQueue: false,
  devOnly: false,
  execute: async (casinoBot, args, username) => {
    const guess = Math.round(Number(args[0]))
    if (guess > 6 || guess < 1 || isNaN(guess)) {
      casinoBot.bot.tell(username, 'Please enter a valid guess! (any number 1 to 6)')
      return
    }
    const user = await jsonManager.getUser(username, casinoBot.gamemode)

    if (user.balance < user.bet || user.balance <= 0) {
      casinoBot.bot.chat(`/msg ${username} You can't afford the bet!`)
      casinoBot.bot.chat(`/msg ${username} Please lower the bet or /pay the bot to add funds`)
      casinoBot.bot.chat(`/msg ${username} You can check your balance with $bal, and bet with $bet`)
      return
    }
    casinoBot.log(`${username} rolling dice with a bet of $${user.bet}`)
    await jsonManager.editUser(username, 'subtract', 'balance', user.bet, casinoBot.gamemode)
    await jsonManager.editUser(username, 'add', 'loss', user.bet, casinoBot.gamemode)
    await jsonManager.editUser(username, 'add', 'diceRolls', 1, casinoBot.gamemode)

    const result = await dice(casinoBot.bot, username, guess, casinoBot.dev)

    if (result.guess === result.roll) {
      const winnings = user.bet * 4
      await jsonManager.editUser(username, 'add', 'balance', winnings, casinoBot.gamemode)
      await jsonManager.editUser(username, 'add', 'gains', winnings, casinoBot.gamemode)
      await jsonManager.editUser(username, 'add', 'diceWins', 1, casinoBot.gamemode)

      casinoBot.bot.tell(username, '⭐ You win!! 4x multiplier! ⭐')
      casinoBot.bot.tell(username, `$${winnings} has been added to your account`)
      casinoBot.bot.tell(casinoBot.dev, `${username} won $${winnings} | ${result.roll} | ${result.guess} |`)
      casinoBot.log(`${username} won $${winnings} | ${result.roll} | ${result.guess} |`)
    } else {
      casinoBot.bot.tell(username, 'You lost... ☹ Try again?')
      casinoBot.log(`${username} lost $${user.bet} | ${result.roll} | ${result.guess}`)
    }
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitRatio (x) {
  const k = 800
  const ms = k / Math.pow(x, 2 / (1 + Math.sqrt(5)))

  await sleep(ms)
}

async function dice (bot, username, guessInt) {
  const symbols = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
  const guess = symbols[guessInt - 1]
  const rollCount = Math.ceil(Math.random() * 5) + 1

  for (let i = rollCount; i > 0; i--) {
    bot.tell(username, '|  ?  |')
    await waitRatio(i)
  }

  const roll = symbols[Math.floor(Math.random() * symbols.length)]

  bot.tell(username, `- ${roll} -`)

  return { roll, guess }
}
