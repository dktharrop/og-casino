import * as jsonManager from '../../json-manager.js'

export default {
  name: 'slots',
  aliases: ['s'],
  description: 'A slot machine',
  skipQueue: false,
  devOnly: false,
  execute: async (casinoBot, args, username) => {
    const user = await jsonManager.getUser(username, casinoBot.gamemode)

    if (user.balance < user.bet || user.balance <= 0) {
      casinoBot.bot.chat(`/msg ${username} You can't afford the bet!`)
      casinoBot.bot.chat(`/msg ${username} Please lower the bet or /pay the bot to add funds`)
      casinoBot.bot.chat(`/msg ${username} You can check your balance with $bal, and bet with $bet`)
      return
    }
    casinoBot.log(`${username} rolling slots with a bet of $${user.bet}`)
    await jsonManager.editUser(username, 'subtract', 'balance', user.bet, casinoBot.gamemode)
    await jsonManager.editUser(username, 'add', 'loss', user.bet, casinoBot.gamemode)
    await jsonManager.editUser(username, 'add', 'slotSpins', 1, casinoBot.gamemode)

    let winnings = 0
    const result = await slots(casinoBot, username, casinoBot.dev)

    switch (result.code) {
      case 'slot3Star':
        winnings = user.bet * 20
        casinoBot.bot.tell(username, '⭐ JACKPOT!! 20x winnings! ⭐')
        break
      case 'slot3Any':
        winnings = user.bet * 10
        casinoBot.bot.tell(username, '3 in a row! 10x multiplier!')
        break
      case 'slot2Star':
        winnings = user.bet * 5
        casinoBot.bot.tell(username, 'Semi-jackpot! 5x bonus!')
        break
      case 'slot2Any':
        winnings = user.bet
        casinoBot.bot.tell(username, '2 in a row!')
        break
      case 'slot1Star':
        winnings = Math.floor(user.bet / 2)
        casinoBot.bot.tell(username, '1 star. (not in a row) Try again?')
        break
      default:
        casinoBot.bot.tell(username, 'You lost... ☹ Try again?')
        casinoBot.log(`${username} lost $${user.bet} | ${result.symbols.join(' ')}`)
        break
    }
    if (winnings > 0) {
      await jsonManager.editUser(username, 'add', 'balance', winnings, casinoBot.gamemode)
      await jsonManager.editUser(username, 'add', 'gains', winnings, casinoBot.gamemode)
      await jsonManager.editUser(username, 'add', result.code, 1, casinoBot.gamemode)
      casinoBot.bot.tell(username, `$${winnings} has been added to your account`)
      casinoBot.bot.tell(casinoBot.dev, `${username} won $${winnings} | ${result.symbols.join(' ')}`)
      casinoBot.log(`${username} won $${winnings} (net of ${winnings - user.bet}) | ${result.symbols.join(' ')}`)
    }
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitRatio (x) {
  const k = 800
  const ms = k / Math.pow(x, 2 / (1 + Math.sqrt(5)))

  await sleep(ms)
}

function randomIndex (list, currentSymbol) {
  if (currentSymbol === '⭐') {
    return Math.floor(Math.random() * (list.length - 1))
  } else {
    return Math.floor(Math.random() * list.length)
  }
}

async function slots (casinoBot, username) {
  const symbols = ['🗡', '🏹', '🪓', '🔱', '🍖', '⭐']
  const rollCount = Math.ceil(Math.random() * 16) + 32
  const result = {
    code: '',
    symbols: []
  }
  casinoBot.bot.tell(username, '------')

  for (let i = rollCount; i > 0; i--) {
    if (i < rollCount / 4) {
      result.symbols[2] = symbols[randomIndex(symbols, result.symbols[2])]

      if (result.symbols[0] === result.symbols[1]) {
        i = (Math.random() < 0.5) ? i + 1 : i
      }
    } else if (i < rollCount / 2) {
      result.symbols[2] = symbols[randomIndex(symbols, result.symbols[2])]
      result.symbols[1] = symbols[randomIndex(symbols, ' ')]
    } else {
      result.symbols[2] = symbols[randomIndex(symbols, ' ')]
      result.symbols[1] = symbols[randomIndex(symbols, ' ')]
      result.symbols[0] = symbols[randomIndex(symbols, ' ')]
    }

    casinoBot.bot.tell(username, `${result.symbols.join(' ')}`)
    casinoBot.bot.tell(username, '------')
    await waitRatio(i)
  }
  if (result.symbols[0] === result.symbols[1] && result.symbols[0] === result.symbols[2]) {
    if (result.symbols[1] === '⭐') {
      result.code = 'slot3Star'
    } else {
      result.code = 'slot3Any'
    }
  } else if (result.symbols[0] === result.symbols[1] || result.symbols[1] === result.symbols[2]) {
    if (result.symbols[1] === '⭐') {
      result.code = 'slot2Star'
    } else {
      result.code = 'slot2Any'
    }
  } else if (result.symbols[0] === '⭐' || result.symbols[1] === '⭐' || result.symbols[2] === '⭐') {
    result.code = 'slot1Star'
  }
  return result
}
