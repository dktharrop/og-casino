import * as jsonManager from './json-manager.js'
import slots from './games/slots.js'
import dice from './games/dice.js'
import dotenv from 'dotenv'

dotenv.config()

const devName = process.env.DEV
const devMode = (process.env.DEVMODE === 'true') ? true : false
const testers = JSON.parse(process.env.TESTERS)

const commands = [
  // general commands
  {
    name: 'bal',
    aliases: [],
    description: 'Display your balance',
    skipQueue: true,
    devOnly: false,
    execute: async (bot, args, username) => {
      const user = await jsonManager.getUser(username)
      bot.whisper(username, `$${formatInt(user.balance)}`)
    }
  },
  {
    name: 'baltop',
    aliases: [ 'bt' ],
    description: 'Show a list of top balances',
    skipQueue: false,
    devOnly: true,
    execute: async (bot, args, username) => {
      bot.whisper(username, 'Getting the top 10 balances...')

      const users = await jsonManager.getUsers()
      users.sort((a, b) => b.balance - a.balance)
  
      // Get the top 10 users
      const top10 = users.slice(0, 10)
  
      // Get usernames for top 10 users
      const usernamePromises = top10.map(user => jsonManager.getUsername(user.uuid));
      const usernames = await Promise.all(usernamePromises);
  
      for (let i = 0; i < top10.length; i++) {
        bot.whisper(username, `${usernames[i]}: $${formatInt(top10[i].balance)}`)
      }
    }
  },
  {
    name: 'bet',
    aliases: [ 'b' ],
    description: 'View or change your bet',
    skipQueue: true,
    devOnly: false,
    execute: async (bot, args, username) => {
      if (args[1]) {
        const newBet = Math.round(Number(args[1]))
        if (newBet >= 100 && newBet <= 500000) {
          await jsonManager.editUser(username, 'set', 'bet', newBet)
          bot.whisper(username, `Your bet has been set to $${formatInt(newBet)}`)
          console.log(`${username} changed their bet to $${formatInt(newBet)}`)
        } else if (newBet < 100) {
          bot.whisper(username, 'The minimum bet is $100!')
        } else {
          bot.whisper(username, 'Please enter a valid bet!')
        }
      } else {
        const user = await jsonManager.getUser(username)
        bot.whisper(username, `Your bet is $${formatInt(user.bet)}`)
      }
    }
  },
  {
    name: 'disclaimer',
    aliases: [ 'dis' ],
    description: 'Please read this!',
    skipQueue: false,
    devOnly: false,
    execute: (bot, args, username) => {
      bot.whisper(username, '------ DISCLAIMER ------')
      bot.whisper(username, 'This bot is not affiliated with the OG Network in any way')
      bot.whisper(username, 'This bot was created for fun, and it\'s possible to win a lot of money!')
      bot.whisper(username, 'Despite this, it\'s also possible to lose money')
      bot.whisper(username, 'Try not to take things too seriously, OG Network money has no real value')
      bot.whisper(username, 'No refunds will be given out, the only exception to this is losses caused by a bug')
      bot.whisper(username, 'Please be responsible!')
      bot.whisper(username, '------------------------')
    }
  },
  {
    name: 'topgains',
    aliases: [ 'gainstop', 'tg', 'gt', 'topg', 'gtop' ],
    description: 'Show a list of the highest earners',
    skipQueue: false,
    devOnly: false,
    execute: async (bot, args, username) => {
      bot.whisper(username, 'Getting the top 10 earnings...')

      const users = await jsonManager.getUsers()
      users.sort((a, b) => b.gains - a.gains)
  
      // Get the top 10 users
      const top10 = users.slice(0, 10)
  
      // Get usernames for top 10 users
      const usernamePromises = top10.map(user => jsonManager.getUsername(user.uuid));
      const usernames = await Promise.all(usernamePromises);
  
      for (let i = 0; i < top10.length; i++) {
        bot.whisper(username, `${usernames[i]}: $${formatInt(top10[i].gains)}`)
      }
    }
  },
  {
    name: 'help',
    aliases: [ 'h' ],
    description: 'Usage info',
    skipQueue: false,
    devOnly: false,
    execute: (bot, args, username) => {
      console.log(`${username} used $help`)
      commands.forEach((command) => {
        if (command.devOnly) return
        bot.whisper(username, `$${command.name} | ${command.description}`)
      })
      bot.whisper(username, 'Pay the bot to add funds to your account and get started!')
    }
  },
  {
    name: 'withdraw',
    aliases: [ 'w' ],
    description: 'Withdraw your funds',
    skipQueue: true,
    devOnly: false,
    execute: async (bot, args, username) => {
      const user = await jsonManager.getUser(username)

      if (!user) {
        bot.whisper(username, 'User not found!')
        return
      }

      const botBalance = getBalance(bot)
      console.log(botBalance)
      const withdrawl = args[1] ? Math.round(Number(args[1])) : user.balance

      if (withdrawl > botBalance) {
        bot.whisper(username, 'The bot does not have enough funds!')
        return
      }

      if (!username || isNaN(withdrawl)) {
        bot.whisper(username, 'Please enter valid arguments!')
        return
      }

      const newBalance = user.balance - withdrawl
      if (newBalance < 0) {
        bot.whisper(username, 'You do not have enough funds to withdraw that amount!')
        return
      }

      if (withdrawl > 0 && withdrawl <= user.balance) {
          await jsonManager.editUser(username, 'set', 'balance', newBalance)
          bot.whisper(username, `Your new balance is $${formatInt(newBalance)}`)

          bot.chat(`/pay ${username} ${withdrawl}` )
          bot.whisper(devName, `Withdrew ${formatInt(withdrawl)} from ${username} ($${formatInt(user.balance)} to $${formatInt(newBalance)})`)
          console.log(`${username} withdrew $${formatInt(withdrawl)} (from $${formatInt(user.balance)} to $${formatInt(newBalance)})`)

      } else {
        bot.whisper(username, 'Please enter a valid withdrawal! Can you afford it?')
      }
    }
  },
  // games
  {
    name: 'coinflip',
    aliases: [ 'cf' ],
    description: 'Coinflip game',
    skipQueue: false,
    devOnly: false,
    execute: async (bot, args, username) => {
      bot.whisper(username, 'Coming soon!')
    }
  },
  {
    name: 'dice',
    aliases: [ 'd' ],
    description: 'Dice game',
    skipQueue: false,
    devOnly: false,
    execute: async (bot, args, username) => {
      const guess = Math.round(Number(args[1]))
      if (guess > 6 || guess < 1 || isNaN(guess)) {
        bot.whisper(username, 'Please enter a valid guess! (any number 1 to 6)')
        return
      }
      await dice(bot, username, args[1])
    }
  },
  {
    name: 'slots',
    aliases: [ 's' ],
    description: 'Slots game',
    skipQueue: false,
    devOnly: false,
    execute: async (bot, args, username) => {
      await slots(bot, username)
    }
  },
  // developer commands
  {
    name: 'cashout',
    aliases: [ 'co' ],
    description: 'Cash out funds',
    skipQueue: true,
    devOnly: true,
    execute: async (bot, args, username) => {
      const botBalance = getBalance(bot)
      const payment = args[1] ? Math.round(Number(args[1])) : botBalance

      if (!devName || isNaN(payment)) {
        bot.whisper(devName, 'Please enter valid arguments!')
        return
      }

      const newBalance = botBalance - payment
      if (newBalance < 0) {
        bot.whisper(devName, 'The bot does not have enough funds!')
        return
      }

      if (payment > 0 && payment <= botBalance) {
          jsonManager.editStats('add', 'profit', payment)
          bot.chat(`/pay ${devName} ${payment}` )
          bot.whisper(devName, `Cashed out $${formatInt(payment)} (from $${formatInt(botBalance)} to $${formatInt(newBalance)})`)

          console.log(`${username} Cashed out $${formatInt(payment)} (from $${formatInt(botBalance)} to $${formatInt(newBalance)})`)

      } else {
        bot.whisper(username, 'Please enter a valid cashout! Can you afford it?')
      }
    }
  },
  {
    name: 'pay',
    aliases: [ 'p' ],
    description: 'Add funds to a user\'s account',
    skipQueue: true,
    devOnly: true,
    execute: async (bot, args, username) => {
      const payment = Number(args[1])
      if (payment > 0) {
        await jsonManager.editUser(username, 'add', 'balance', payment)
        bot.whisper(username, `$${formatInt(payment)} has been added to your account`)
        console.log(`${username} added $${formatInt(payment)} to their account`)
      } else {
        bot.whisper(username, 'Please enter a valid payment!')
      }
    }
  },
  {
    name: 'profit',
    aliases: [ 'pf, pr, pt, pft' ],
    description: 'Show net profit',
    skipQueue: true,
    devOnly: true,
    execute: async (bot, args, username) => {
      const users = await jsonManager.getUsers()
      const profitStat = jsonManager.getStats('profit')

      let debt = 0
      for (let i = 0; i < users.length; i++) {
        debt += users[i].balance
      }
      bot.chat('/bal')
      bot.once('messagestr', (message) => {
        const balMatch = message.match(/^Balance: \$(\d{1,3}(?:,\d{3})*)/)
        if (balMatch) {
          let gross = parseInt(balMatch[1].replace(/[^0-9]/g, '')) + profitStat // this doesnt work with decimals
          const net = gross - debt
          bot.whisper(devName, `$${formatInt(net)}`)
        }
      })
    }
  }
]

const commandQueue = []

export function parseCommand(username, message, messageType) {
  const commandMatch = (typeof message === 'string') ? message.match(/^\$.+/) : false
  if (commandMatch) {
    const commandName = commandMatch[0].slice(1).split(' ')[0].trim()
    const commandArgs = message.split(' ').filter(arg => arg !== '').filter(arg => !arg.startsWith('$'))
    commandArgs.unshift(username)
    
    if (getCommand(commandName) === undefined) {
      return 'invalid'
    } else {
      return { commandName, commandArgs }
    }
  } 
  // fix this
  // else if (messageType === 'payment') {
  //   return {
  //     commandName: 'pay',
  //     commandArgs: [ username, message ]
  //   }
  // } 
  else {
    return false
  }
}

//helper functions
function getBalance(bot) {
  const scoreboard = bot.scoreboard
  for (let key in scoreboard['1'].itemsMap) {
    const input = scoreboard['1'].itemsMap[key].displayName.toString()
    const balMatch = input.match(/\$(\d{1,3}(?:,\d{3})*)/)
    if (balMatch) {
      return Math.floor(parseInt(balMatch[1].replace(/[^0-9]/g, '')))
    }
  }
  return false
}

// queue system
function getCommand(commandName) {
  return commands.find(command => command.name === commandName || command.aliases.includes(commandName))
}

export async function enqueueCommand(bot, commandName, commandArgs) {
  const command = getCommand(commandName)
  if (devMode && !testers.includes(commandArgs[0])) {
    bot.whisper(commandArgs[0], 'The bot is in dev mode! Commands are disabled for now.')
  }

  if (command.devOnly && (commandArgs[0] !== devName)) {
    console.log(command.devOnly, commandArgs[0], devName)
    bot.whisper(commandArgs[0], 'This command is for developers only!')
    return
  }

  if (command.skipQueue) {
    command.execute(bot, commandArgs, commandArgs[0]);
    return
  }

  if (commandQueue.find(command => command.username === commandArgs[0])) {
    if (commandQueue[0] && commandQueue[0].username === commandArgs[0]) {
      bot.whisper(commandArgs[0], `You are already running a command!`)
      return
    } else {
      bot.whisper(commandArgs[0], `You are already in the queue! You are in position ${commandQueue.length - 1}`)
      return
    }
  } else if (commandArgs) {
    commandQueue.push({ command, commandArgs, username: commandArgs[0] });
    if (commandQueue.length > 1) {
      bot.whisper(commandArgs[0], `You have been added to the queue! You are in position ${commandQueue.length - 1}`)
    }
  }

  if (commandQueue.length === 1) {
    await executeNextCommand(bot)
  }
}

async function executeNextCommand(bot) {
  if (commandQueue.length === 0) {
    return
  }

  const { command, commandArgs } = commandQueue[0];

  try {
    await command.execute(bot, commandArgs, commandArgs[0]);
  } catch (error) {
    console.error(error)
  }

  commandQueue.shift();

  if (commandQueue.length > 0) {
    await executeNextCommand(bot)
  }
}

function formatInt(int) {
  return int.toLocaleString("en-US")
}
