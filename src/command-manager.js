import * as userManager from './user-manager.js'
import slots from './games/slots.js'
const devMode = false

export default async function matchCommands(bot, jsonMsg) {
  const rawMsg = jsonMsg.toString()
  const chatMsg = getMessage(rawMsg)
  const whisper = getWhisper(rawMsg)
  if (!whisper) {
    getPayment(bot, rawMsg)
  } else if (bot.busy) {
    bot.whisper(whisper.username, 'Bot is busy! Only one player can roll slots at a time to avoid the bot being spam kicked. Please wait...')
    return
  } else if (devCheck(bot, whisper.username)) {
    bot.whisper(whisper.username, 'bot is busy! please wait...')
  } else if (chatMsg) {
    warningCommand(bot, chatMsg.msgContent, chatMsg.username)
  } else {
    balCommand(bot, whisper.msgContent, whisper.username)
    await baltopCommand(bot, whisper.msgContent, whisper.username)
    betCommand(bot, whisper.msgContent, whisper.username)
    coinflipCommand(bot, whisper.msgContent, whisper.username)
    helpCommand(bot, whisper.msgContent, whisper.username)
    await profitCommand(bot, whisper.msgContent, whisper.username)
    slotsCommand(bot, whisper.msgContent, whisper.username)
    withdrawCommand(bot, whisper.msgContent, whisper.username)
  }
}

function devCheck(bot, username) {
  if (devMode === true & username !== '150cc') {
    bot.whisper(username, 'This bot is in development mode!')
    bot.whisper(username, 'Please use the stable version of the bot by messaging VegasCasino1')
    bot.whisper(username, 'Contact 150cc if you think this is an error!')
    bot.whisper('150cc', `${username} attempted to access bot in dev mode!`)
    return true
  } else {
    return false
  }
}

function getWhisper(message) {
  const msgMatch = message.match(/^From ✪?\[[^\]]+\] ([^:]+): (.+)$/)
  if (msgMatch) {
    console.log(message)
    return {username: msgMatch[1], msgContent: msgMatch[2]}
  }
  else {
    return false
  }
}

function getMessage(message) {
  const msgMatch = message.match(/^\[[^\]]+\](?:.*?)? ✪?\[[^\]]+\] ([^:]+): (.+)$/)
  if (msgMatch) {
    return {username: msgMatch[1], msgContent: msgMatch[2]}
  }
  else {
    return false
  }
}

function getPayment (bot, rawMsg) {
  const payMatch = rawMsg.match(/\$(\d{1,3}(?:,\d{3})*) has been received from ✪?\[[^\]]+\] (.+)\.$/)
  if (payMatch) {
    console.log(rawMsg)
    const payment = payMatch[1]
    const paymentInteger = parseInt(payment.replace(/[^0-9]/g, ''))
    const username = payMatch[2]

    bot.whisper(username, `$${payment} has been added to your account`)
    userManager.editUser(username, 'add', 'balance', paymentInteger)
  } 
}

function balCommand(bot, command, username) {
  if (command.match(/^-bal\b/)) {
    userManager.getUser(username).then(user => {
      bot.whisper(username, `$${user.balance}`)
    })
  }
}

async function baltopCommand(bot, command, username) {
  if (command.match(/^-baltop/)) {
    bot.busy = true
    bot.whisper(username, 'Getting the top 10 balances...')

    const users = await userManager.getUsers()
    users.sort((a, b) => b.balance - a.balance)

    // Get the top 10 users
    const top10 = users.slice(0, 10)

    // Get usernames for top 10 users
    const usernamePromises = top10.map(user => userManager.getUsername(user.uuid));
    const usernames = await Promise.all(usernamePromises);

    for (let i = 0; i < top10.length; i++) {
      bot.whisper(username, `${usernames[i]}: $${top10[i].balance}`)
    }
    bot.busy = false
  }
}

function betCommand(bot, command, username) {
  if (command.match(/^-bet/)) {
    const betMatch = command.match(/^-bet (\d+)/)
    if (betMatch) {
      const newBet = Number(betMatch[1])
      if (newBet >= 100 && newBet < 10000000) {
        userManager.editUser(username, 'set', 'bet', newBet)
        bot.whisper(username, `Your bet has been set to $${newBet}`)
      } else if (newBet < 100) {
        bot.whisper(username, 'The minimum bet is $100!')
      } else {
        bot.whisper(username, 'Please enter a valid bet!')
      }
    } else {
      userManager.getUser(username).then(user => {
        bot.whisper(username, `Your bet is $${user.bet}`)
        bot.whisper(username, `A win gives you $${user.bet * 10}`)
      })
    }
  }
}

function coinflipCommand(bot, command, username) {
  if (command.match(/^-cf/) || command.match(/^coinflip/)) {
    bot.whisper(username, 'Coming soon!')
  }
}

function helpCommand(bot, command, username) {
  if (command.match(/^-help/) || command.match(/^-h/)) {
    const commands = [
      {commandName: '-help', arguments:'', info:'show this page'},
      {commandName: '-bal', arguments:'user', info:'display your balance, or the balance of another user'},
      {commandName: '-baltop', arguments:'', info:'show a list of the richest players'},
      {commandName: '-bet', arguments:'number*', info:'view your bet, or set your bet to a number'},
      {commandName: '-slots', arguments:'', info:'slots game'},
      {commandName: '-coinflip', arguments:'', info:'IN DEVELOPMENT'},
      {commandName: '-withdraw', arguments:'', info:'withdraw your funds'}
    ]
    commands.forEach((command) => {
      bot.whisper(username, `${command.commandName} | ${command.info}`)
    })
    bot.whisper(username, 'Pay the bot to add funds to your account and get started!')
  }
}

async function profitCommand(bot, command, username) {
  if (command.match(/^-profit/) && username === '150cc') {
    const users = await userManager.getUsers()

    let debt = 0;
    for (let i = 0; i < users.length; i++) {
      debt += users[i].balance
    }
    bot.chat('/bal')
    bot.once('messagestr', (message) => {
      const balMatch = message.match(/^Balance: \$(\d{1,3}(?:,\d{3})*)/)
      if (balMatch) {
        const gross = parseInt(balMatch[1].replace(/[^0-9]/g, ''))
        const net = gross - debt
        bot.whisper('150cc', `$${net}`)
      }
    })
  }
}

function slotsCommand (bot, command, username) {
  if (command.match(/^-slot/)) {
    slots(bot, username)
  }
}

function warningCommand (bot, command, username) {
  console.log(`"${username}", "${command}"`)
  if (command.match(/^-slot/)) {
    console.log(`"${username}", "${command}"`)
    bot.whisper(username, 'Please /msg the bot! All bot commands are done through private messages to avoid spam. Confused? Use -help for more info.')
  }
}

async function withdrawCommand(bot, command, username) { // TODO
  if (command.match(/^-withdraw/)) {
    const withdrawMatch = command.match(/^-withdraw (.*?)\s(\d+)/)
    if (withdrawMatch && username === '150cc') {
      const player = withdrawMatch[1]
      const withdrawl = withdrawMatch[2]
      const user = await userManager.getUser(player)

      console.log(user.balance)
      console.log(user)

      if (withdrawl > 0 && withdrawl <= user.balance) {
        userManager.editUser(player, 'set', 'balance', user.balance - withdrawl)
        bot.whisper(player, `$${withdrawl} withdrawn`)
        bot.whisper(player, `Your new balance is $${user.balance - withdrawl}`)
        bot.chat(`/pay ${player} ${withdrawl}`)
      } else {
        bot.whisper(username, 'Please enter a valid withdrawl! Can you afford it?')
      }
    } else {
      bot.whisper(username, 'Contact 150cc on discord or ingame to withdraw funds!')
    }
  }
}
