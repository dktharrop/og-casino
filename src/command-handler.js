/* eslint-disable no-unreachable */
import * as jsonManager from './json-manager.js'
import slots from './games/slots.js'
import dice from './games/dice.js'
import casinoManager from './main.js'
import dotenv from 'dotenv'

dotenv.config()

const devName = process.env.DEV
const devMode = (process.env.DEVMODE === 'true')
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
      bot.tell(username, `$${formatInt(user.balance)}`)
    }
  },
  {
    name: 'baltop',
    aliases: ['bt'],
    description: 'Show a list of top balances',
    skipQueue: false,
    devOnly: true,
    execute: async (bot, args, username) => {
      bot.tell(username, 'Getting the top 10 balances...')

      const users = await jsonManager.getUsers()
      users.sort((a, b) => b.balance - a.balance)

      // Get the top 10 users
      const top10 = users.slice(0, 10)

      // Get usernames for top 10 users
      const usernamePromises = top10.map(user => jsonManager.getUsername(user.uuid))
      const usernames = await Promise.all(usernamePromises)

      for (let i = 0; i < top10.length; i++) {
        bot.tell(username, `${usernames[i]}: $${formatInt(top10[i].balance)}`)
      }
    }
  },
  {
    name: 'bet',
    aliases: ['b'],
    description: 'View or change your bet',
    skipQueue: true,
    devOnly: false,
    execute: async (bot, args, username) => {
      if (args[1]) {
        const crashPlayer = casinoManager.games.crash.players.find(player => player.username === username)
        if (crashPlayer && (crashPlayer.state === 'playing' || crashPlayer.state === 'claimed' || crashPlayer.state === 'joining')) {
          bot.tell(username, 'You can only change your bet while spectating!')
          return
        }
        const newBet = Math.round(Number(args[1]))
        if (newBet >= 0 && newBet <= 250000) {
          await jsonManager.editUser(username, 'set', 'bet', newBet)
          bot.tell(username, `Your bet has been set to $${formatInt(newBet)}`)
          console.log(`${username} changed their bet to $${formatInt(newBet)}`)
        } else if (newBet < 100) {
          bot.tell(username, 'The minimum bet is $100!')
        } else if (newBet > 250000) {
          bot.tell(username, 'The maximum bet is $250,000!')
        } else {
          bot.tell(username, 'Please enter a valid bet!')
        }
      } else {
        const user = await jsonManager.getUser(username)
        bot.tell(username, `Your bet is $${formatInt(user.bet)}`)
      }
    }
  },
  {
    name: 'bonus',
    aliases: ['bon', 'bo'],
    description: 'Claim your welcome bonus',
    skipQueue: true,
    devOnly: false,
    execute: async (bot, args, username) => {
      const bonus = 5000
      const user = await jsonManager.getUser(username)

      if (user.bonus) {
        bot.tell(username, 'You have already claimed the welcome bonus!')
        return
      }

      await jsonManager.editUser(username, 'add', 'balance', bonus)
      await jsonManager.editUser(username, 'add', 'gains', bonus)
      await jsonManager.editUser(username, 'set', 'bonus', true)
      bot.tell(username, `$${bonus} has been added to your account!`)
      console.log(`${username} claimed their welcome bonus of $${bonus}!`)
    }
  },
  {
    name: 'daily',
    aliases: ['d'],
    description: 'Claim your daily reward',
    skipQueue: true,
    devOnly: false,
    execute: async (bot, args, username) => {
      const daily = 1000
      const user = await jsonManager.getUser(username)

      const now = Math.floor(Date.now() / 1000)
      if (now - user.lastDaily >= 86400) {
        await jsonManager.editUser(username, 'add', 'balance', daily)
        await jsonManager.editUser(username, 'add', 'gains', daily)
        await jsonManager.editUser(username, 'set', 'lastDaily', now)
        bot.tell(username, `You have claimed your daily reward of $${daily}!`)
        console.log(`${username} claimed their daily reward of $${daily}!`)
      } else {
        const timeLeft = 86400 - (now - user.lastDaily)
        const hours = Math.floor(timeLeft / 3600)
        const minutes = Math.floor((timeLeft - (hours * 3600)) / 60)
        const seconds = timeLeft - (hours * 3600) - (minutes * 60)
        bot.tell(username, `You can claim your daily reward in${(hours > 0) ? ` ${hours} hours,` : ''}${(minutes > 0) ? ` ${minutes} minutes,` : ''}${(seconds > 0) ? ` ${seconds} seconds` : ''}`)
      }
    }
  },
  {
    name: 'disclaimer',
    aliases: ['dis'],
    description: 'Please read this!',
    skipQueue: false,
    devOnly: false,
    execute: (bot, args, username) => {
      bot.tell(username, '------ DISCLAIMER ------')
      bot.tell(username, 'This bot is not affiliated with the OG Network in any way')
      bot.tell(username, 'This bot was created for fun, and it\'s possible to win a lot of money!')
      bot.tell(username, 'Despite this, it\'s also possible to lose money')
      bot.tell(username, 'Try not to take things too seriously, OG Network money has no real value')
      bot.tell(username, 'No refunds will be given out, the only exception to this is losses caused by a bug')
      bot.tell(username, 'Please be responsible!')
      bot.tell(username, '------------------------')
    }
  },
  {
    name: 'discord',
    aliases: ['dc'],
    description: 'Join the discord for help',
    skipQueue: true,
    devOnly: false,
    execute: (bot, args, username) => {
      bot.tell(username, 'Want updates on lotteries and giveaways? Found a bug? Need help? Join the discord!')
      bot.tell(username, 'https://discord.gg/zAAtQy3DG5')
    }
  },
  {
    name: 'topgains',
    aliases: ['gainstop', 'tg', 'gt', 'topg', 'gtop'],
    description: 'Show a list of the highest earners',
    skipQueue: false,
    devOnly: false,
    execute: async (bot, args, username) => {
      bot.tell(username, 'Getting the top 10 earnings...')

      const users = await jsonManager.getUsers()
      users.sort((a, b) => b.gains - a.gains)

      // Get the top 10 users
      const top10 = users.slice(0, 10)

      // Get usernames for top 10 users
      const usernamePromises = top10.map(user => jsonManager.getUsername(user.uuid))
      const usernames = await Promise.all(usernamePromises)

      for (let i = 0; i < top10.length; i++) {
        bot.tell(username, `${usernames[i]}: $${formatInt(top10[i].gains)}`)
      }
    }
  },
  {
    name: 'help',
    aliases: ['h'],
    description: 'Usage info',
    skipQueue: false,
    devOnly: false,
    execute: (bot, args, username) => {
      console.log(`${username} used $help`)
      bot.tell(username, '--------- HELP ---------')
      commands.forEach((command) => {
        if (command.devOnly) return
        bot.tell(username, `$${command.name} | ${command.description}`)
      })
      bot.tell(username, '------------------------')
      bot.tell(username, 'Pay the bot to add funds to your account and get started!')
      bot.tell(username, 'Still confused? Join the discord for help! https://discord.gg/zAAtQy3DG5')
    }
  },
  {
    name: 'lottery',
    aliases: ['l'],
    description: 'Enter the lottery',
    skipQueue: true,
    devOnly: false,
    execute: async (bot, args, username) => {
      bot.tell(username, "The lottery isn't running right now!")
      return

      const user = await jsonManager.getUser(username)
      const purchase = args[1] ? Math.round(Number(args[1])) : false
      const ticketCost = 1000

      if ((isNaN(purchase) || purchase <= 0) && purchase !== false) {
        bot.tell(username, 'Please enter valid arguments!')
        return
      }

      if (purchase === false) {
        const jackpot = jsonManager.getStats('jackpot')
        bot.tell(username, `Each ticket costs $${formatInt(ticketCost)}`)
        bot.tell(username, `You have ${user.tickets} ticket${(user.tickets === 1) ? '' : 's'}`)
        bot.tell(username, `The jackpot is currently $${formatInt(jackpot)}`)
        bot.tell(username, 'You can buy tickets with $lottery <amount>')
        bot.tell(username, 'Each ticket gives you another entry in the draw!')
        return
      }

      const cost = ticketCost * purchase

      if (user.balance < (cost)) {
        bot.tell(username, 'You can\'t afford that many tickets!')
        return
      }

      await jsonManager.editUser(username, 'subtract', 'balance', cost)
      await jsonManager.editUser(username, 'add', 'loss', cost)
      await jsonManager.editUser(username, 'add', 'tickets', purchase)
      jsonManager.editStats('add', 'jackpot', cost * 0.9)
      bot.tell(username, `You purchased ${purchase} ticket${(purchase === 1) ? '' : 's'} for $${formatInt(cost)}`)
      bot.tell(username, `You now have ${user.tickets + purchase} ticket${(user.tickets + purchase === 1) ? '' : 's'} total, good luck!`)
      console.log(`${username} bought ${purchase} ticket${(purchase === 1) ? '' : 's'}`)
    }
  },
  {
    name: 'tpaccept',
    aliases: [],
    description: 'Accept a teleport request',
    skipQueue: true,
    devOnly: true,
    execute: (bot, args, username) => {
      if (!args[1]) {
        bot.tell(username, 'Please enter valid arguments!')
        return
      }
      bot.chat(`/tpaccept ${args[1]}`)
    }
  },
  {
    name: 'withdraw',
    aliases: ['w'],
    description: 'Withdraw your funds',
    skipQueue: true,
    devOnly: false,
    execute: async (bot, args, username) => {
      const user = await jsonManager.getUser(username)

      if (!user) {
        bot.tell(username, 'User not found!')
        return
      }

      const botBalance = getBalance(bot)
      console.log(botBalance)
      const withdrawl = args[1] ? Math.round(Number(args[1])) : user.balance

      if (withdrawl > botBalance) {
        bot.tell(username, 'The bot does not have enough funds!')
        return
      }

      if (!username || isNaN(withdrawl)) {
        bot.tell(username, 'Please enter valid arguments!')
        return
      }

      const newBalance = user.balance - withdrawl
      if (newBalance < 0) {
        bot.tell(username, 'You do not have enough funds to withdraw that amount!')
        return
      }

      if (withdrawl > 0 && withdrawl <= user.balance) {
        await jsonManager.editUser(username, 'set', 'balance', newBalance)
        bot.tell(username, `Your new balance is $${formatInt(newBalance)}`)

        bot.chat(`/pay ${username} ${withdrawl}`)
        bot.tell(devName, `Withdrew ${formatInt(withdrawl)} from ${username} ($${formatInt(user.balance)} to $${formatInt(newBalance)})`)
        console.log(`${username} withdrew $${formatInt(withdrawl)} (from $${formatInt(user.balance)} to $${formatInt(newBalance)})`)
      } else {
        bot.tell(username, 'Please enter a valid withdrawal! Can you afford it?')
      }
    }
  },
  // games
  // {
  //   name: 'coinflip',
  //   aliases: [ 'cf' ],
  //   description: 'Coinflip game',
  //   skipQueue: false,
  //   devOnly: false,
  //   execute: async (bot, args, username) => {
  //     const player = args[1] ? args[1] : false
  //     if (args[2] === 'challenge') {
  //       if (!player || !bot.players[player]) {
  //         bot.tell(username, 'Please enter a valid player!')
  //         return
  //       }
  //       bot.tell(username, `Request sent to ${player}! They have 30 seconds to accept.`)
  //       bot.tell(player, `${username} has challenged you to a coinflip! You $coinflip accept to accept. The request will expire in 30 seconds.`)

  //       setTimeout(() => {
  //         if (bot.players[player]) {
  //           bot.tell(player, 'The request has expired.')
  //           return
  //         }
  //       }, 30000)
  //       return
  //     }
  //     if (args[2] === 'accept') {

  //     }
  //   }
  // },
  {
    name: 'crash',
    aliases: ['cr'],
    description: 'Claim the jackpot before the crash!',
    skipQueue: 'true',
    devOnly: false,
    execute: async (bot, args, username) => {
      casinoManager.games.crash.joinGame(bot, username)
    }
  },
  {
    name: 'dice',
    aliases: ['d'],
    description: 'Dice game',
    skipQueue: false,
    devOnly: false,
    execute: async (bot, args, username) => {
      const guess = Math.round(Number(args[1]))
      if (guess > 6 || guess < 1 || isNaN(guess)) {
        bot.tell(username, 'Please enter a valid guess! (any number 1 to 6)')
        return
      }
      const user = await jsonManager.getUser(username)

      if (user.balance < user.bet || user.balance <= 0) {
        bot.chat(`/msg ${username} You can't afford the bet!`)
        bot.chat(`/msg ${username} Please lower the bet or /pay the bot to add funds`)
        bot.chat(`/msg ${username} You can check your balance with $bal, and bet with $bet`)
        return
      }
      console.log(`${username} rolling dice with a bet of $${user.bet}`)
      await jsonManager.editUser(username, 'subtract', 'balance', user.bet)
      await jsonManager.editUser(username, 'add', 'loss', user.bet)
      await jsonManager.editUser(username, 'add', 'diceRolls', 1)

      const result = await dice(bot, username, guess, devName)

      if (result.guess === result.roll) {
        const winnings = user.bet * 4
        await jsonManager.editUser(username, 'add', 'balance', winnings)
        await jsonManager.editUser(username, 'add', 'gains', winnings)
        await jsonManager.editUser(username, 'add', 'diceWins', 1)

        bot.tell(username, '⭐ You win!! 4x multiplier! ⭐')
        bot.tell(username, `$${winnings} has been added to your account`)
        bot.tell(devName, `${username} won $${winnings} | ${result.roll} | ${result.guess} |`)
        console.log(`${username} won $${winnings} | ${result.roll} | ${result.guess} |`)
      } else {
        bot.tell(username, 'You lost... ☹ Try again?')
        console.log(`${username} lost $${user.bet} | ${result.roll} | ${result.guess}`)
      }
    }
  },
  {
    name: 'slots',
    aliases: ['s'],
    description: 'Slots game',
    skipQueue: false,
    devOnly: false,
    execute: async (bot, args, username) => {
      const user = await jsonManager.getUser(username)

      if (user.balance < user.bet || user.balance <= 0) {
        bot.chat(`/msg ${username} You can't afford the bet!`)
        bot.chat(`/msg ${username} Please lower the bet or /pay the bot to add funds`)
        bot.chat(`/msg ${username} You can check your balance with $bal, and bet with $bet`)
        return
      }
      console.log(`${username} rolling slots with a bet of $${user.bet}`)
      await jsonManager.editUser(username, 'subtract', 'balance', user.bet)
      await jsonManager.editUser(username, 'add', 'loss', user.bet)
      await jsonManager.editUser(username, 'add', 'slotSpins', 1)

      let winnings = 0
      const result = await slots(bot, username, devName)

      switch (result.code) {
        case 'slot3Star':
          winnings = user.bet * 20
          bot.tell(username, '⭐ JACKPOT!! 20x winnings! ⭐')
          break
        case 'slot3Any':
          winnings = user.bet * 10
          bot.tell(username, '3 in a row! 10x multiplier!')
          break
        case 'slot2Star':
          winnings = user.bet * 5
          bot.tell(username, 'Semi-jackpot! 5x bonus!')
          break
        case 'slot2Any':
          winnings = user.bet
          bot.tell(username, '2 in a row!')
          break
        case 'slot1Star':
          winnings = Math.floor(user.bet / 2)
          bot.tell(username, '1 star. (not in a row) Try again?')
          break
        default:
          bot.tell(username, 'You lost... ☹ Try again?')
          console.log(`${username} lost $${user.bet} | ${result.symbols.join(' ')}`)
          break
      }
      if (winnings > 0) {
        await jsonManager.editUser(username, 'add', 'balance', winnings)
        await jsonManager.editUser(username, 'add', 'gains', winnings)
        await jsonManager.editUser(username, 'add', result.code, 1)
        bot.tell(username, `$${winnings} has been added to your account`)
        bot.tell(devName, `${username} won $${winnings} | ${result.symbols.join(' ')}`)
        console.log(`${username} won $${winnings} (net of ${winnings - user.bet}) | ${result.symbols.join(' ')}`)
      }
    }
  },
  // developer commands
  {
    name: 'cashout',
    aliases: ['co'],
    description: 'Cash out funds',
    skipQueue: true,
    devOnly: true,
    execute: (bot, args, username) => {
      const botBalance = getBalance(bot)
      const payment = args[1] ? Math.round(Number(args[1])) : botBalance

      if (!devName || isNaN(payment)) {
        bot.tell(devName, 'Please enter valid arguments!')
        return
      }

      const newBalance = botBalance - payment
      if (newBalance < 0) {
        bot.tell(devName, 'The bot does not have enough funds!')
        return
      }

      if (payment > 0 && payment <= botBalance) {
        jsonManager.editStats('add', 'profit', payment)
        bot.chat(`/pay ${devName} ${payment}`)
        bot.tell(devName, `Cashed out $${formatInt(payment)} (from $${formatInt(botBalance)} to $${formatInt(newBalance)})`)

        console.log(`${username} Cashed out $${formatInt(payment)} (from $${formatInt(botBalance)} to $${formatInt(newBalance)})`)
      } else {
        bot.tell(username, 'Please enter a valid cashout! Can you afford it?')
      }
    }
  },
  {
    name: 'editstat',
    aliases: ['es'],
    description: 'Edit a stat',
    skipQueue: true,
    devOnly: true,
    execute: (bot, args, username) => {
      const stat = args[1]
      const action = args[2]
      const value = Number(args[3])

      if (!stat || !action || isNaN(value)) {
        bot.tell(username, 'Please enter valid arguments!')
        return
      }

      jsonManager.editStats(action, stat, value)
      bot.tell(username, `Edited ${stat} by ${value}`)
    }
  },
  {
    name: 'pay',
    aliases: ['p'],
    description: 'Add funds to a user\'s account',
    skipQueue: true,
    devOnly: true,
    execute: async (bot, args, username) => {
      const payment = Number(args[1])
      if (payment > 0) {
        await jsonManager.editUser(username, 'add', 'balance', payment)
        bot.tell(username, `$${formatInt(payment)} has been added to your account`)
        console.log(`${username} added $${formatInt(payment)} to their account`)
      } else {
        bot.tell(username, 'Please enter a valid payment!')
      }
    }
  },
  {
    name: 'profit',
    aliases: ['pf, pr, pt, pft'],
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
      debt += jsonManager.getStats('jackpot')
      bot.chat('/bal')
      bot.once('messagestr', (message) => {
        const balMatch = message.match(/^Balance: \$(\d{1,3}(?:,\d{3})*)/)
        if (balMatch) {
          const gross = parseInt(balMatch[1].replace(/[^0-9]/g, '')) + profitStat // this doesnt work with decimals
          const net = gross - debt
          bot.tell(devName, `$${formatInt(net)}`)
        }
      })
    }
  }
]

const commandQueue = []

// helper functions
function getBalance (bot) {
  const scoreboard = bot.scoreboard
  for (const key in scoreboard['1'].itemsMap) {
    const input = scoreboard['1'].itemsMap[key].displayName.toString()
    const balMatch = input.match(/\$(\d{1,3}(?:,\d{3})*)/)
    if (balMatch) {
      return Math.floor(parseInt(balMatch[1].replace(/[^0-9]/g, '')))
    }
  }
  return false
}

// queue system
export function getCommand (commandName) {
  return commands.find(command => command.name === commandName || command.aliases.includes(commandName))
}

export async function enqueueCommand (bot, commandName, commandArgs) {
  const command = getCommand(commandName)
  if (devMode && !testers.includes(commandArgs[0])) {
    bot.tell(commandArgs[0], 'The bot is in dev mode! Commands are disabled for now.')
  }

  if (command.devOnly && (commandArgs[0] !== devName)) {
    console.log(command.devOnly, commandArgs[0], devName)
    bot.tell(commandArgs[0], 'This command is for developers only!')
    return
  }

  if (command.skipQueue) {
    command.execute(bot, commandArgs, commandArgs[0])
    return
  }

  if (commandQueue.find(command => command.username === commandArgs[0])) {
    if (commandQueue[0] && commandQueue[0].username === commandArgs[0]) {
      bot.tell(commandArgs[0], 'You are already running a command!')
      return
    } else {
      bot.tell(commandArgs[0], `You are already in the queue! You are in position ${commandQueue.length - 1}`)
      return
    }
  } else if (commandArgs) {
    commandQueue.push({ command, commandArgs, username: commandArgs[0] })
    if (commandQueue.length > 1) {
      bot.tell(commandArgs[0], `You have been added to the queue! You are in position ${commandQueue.length - 1}`)
    }
  }

  if (commandQueue.length === 1) {
    await executeNextCommand(bot)
  }
}

async function executeNextCommand (bot) {
  if (commandQueue.length === 0) {
    return
  }

  const { command, commandArgs } = commandQueue[0]

  try {
    await command.execute(bot, commandArgs, commandArgs[0])
  } catch (error) {
    console.error(error)
  }

  commandQueue.shift()

  if (commandQueue.length > 0) {
    await executeNextCommand(bot)
  }
}

function formatInt (int) {
  return int.toLocaleString('en-US')
}
