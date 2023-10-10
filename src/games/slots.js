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

export default async function slots (bot, username, devName) {
  const symbols = ['🗡', '🏹', '🪓', '🔱', '🍖', '⭐']
  const rollCount = Math.ceil(Math.random() * 16) + 32
  const result = { 
    code: '', 
    symbols: []
 }
  bot.whisper(username, '------')

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

    bot.whisper(username, `${result.symbols.join(' ')}`)
    bot.whisper(username, '------')
    await waitRatio(i)
  }
  if (result.symbols[0] === result.symbols[1] && result.symbols[0] === result.symbols[2]) {
    if (result.symbols[1] === '⭐') {
      result.code = 'slot3Star'
    } else {
      result.code = 'slot3Any'
    }
  } else if (result.symbols[0] == result.symbols[1] || result.symbols[1] == result.symbols[2]) {
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
