import * as userManager from './user-manager.js'
import slots from './games/slots.js'
import dotenv from 'dotenv'

dotenv.config()

const devName = process.env.DEV

const commands = [
  // general commands
  {
    name: 'bal',
    aliases: [],
    description: 'Display your balance',
    devOnly: false,
    execute: async (bot, args, username) => {
      const user = await userManager.getUser(username)
      bot.whisper(username, `$${user.balance}`)
    }
  },
  {
    name: 'baltop',
    aliases: [ 'bt' ],
    description: 'Show a list of top balances',
    devOnly: true,
    execute: async (bot, args, username) => {
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
    }
  },
  {
    name: 'bet',
    aliases: [ 'b' ],
    description: 'View or change your bet',
    devOnly: false,
    execute: async (bot, args, username) => {
      if (args[1]) {
        const newBet = Math.round(Number(args[1]))
        if (newBet >= 100 && newBet < 1000000) {
          await userManager.editUser(username, 'set', 'bet', newBet)
          bot.whisper(username, `Your bet has been set to $${newBet}`)
          console.log(`${username} changed their bet to $${newBet}`)
        } else if (newBet < 100) {
          bot.whisper(username, 'The minimum bet is $100!')
        } else {
          bot.whisper(username, 'Please enter a valid bet!')
        }
      } else {
        const user = await userManager.getUser(username)
        bot.whisper(username, `Your bet is $${user.bet}`)
        bot.whisper(username, `A win gives you $${user.bet * 10}`)
      }
    }
  },
  {
    name: 'topgains',
    aliases: [ 'gainstop', 'tg', 'gt', 'topg', 'gtop' ],
    description: 'Show a list of the highest earners',
    devOnly: false,
    execute: async (bot, args, username) => {
      bot.whisper(username, 'Getting the top 10 earnings...')

      const users = await userManager.getUsers()
      users.sort((a, b) => b.gains - a.gains)
  
      // Get the top 10 users
      const top10 = users.slice(0, 10)
  
      // Get usernames for top 10 users
      const usernamePromises = top10.map(user => userManager.getUsername(user.uuid));
      const usernames = await Promise.all(usernamePromises);
  
      for (let i = 0; i < top10.length; i++) {
        bot.whisper(username, `${usernames[i]}: $${top10[i].gains}`)
      }
    }
  },
  {
    name: 'help',
    aliases: [ 'h' ],
    description: 'Usage info',
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
  // games
  {
    name: 'coinflip',
    aliases: [ 'cf' ],
    description: 'Coinflip game',
    devOnly: false,
    execute: async (bot, args, username) => {
      bot.whisper(username, 'Coming soon!')
    }
  },
  {
    name: 'slots',
    aliases: [ 's' ],
    description: 'Slots game',
    devOnly: false,
    execute: async (bot, args, username) => {
      await slots(bot, username)
    }
  },
  // developer commands
  {
    name: 'pay',
    aliases: [ 'p' ],
    description: 'Add funds to a user\'s account',
    devOnly: true,
    execute: async (bot, args, username) => {
      const payment = Number(args[1])
      if (payment > 0) {
        await userManager.editUser(username, 'add', 'balance', payment)
        bot.whisper(username, `$${payment} has been added to your account`)
        console.log(`${username} added $${payment} to their account`)
      } else {
        bot.whisper(username, 'Please enter a valid payment!')
      }
    }
  },
  {
    name: 'profit',
    aliases: [ 'pf, pr, pt, pft' ],
    description: 'Show net profit',
    devOnly: true,
    execute: async (bot, args, username) => {
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
          bot.whisper(devName, `$${net.toLocaleString("en-US")}`)
        }
      })
    }
  },
  {
    name: 'withdraw',
    aliases: [ 'w' ],
    description: 'Withdraw your funds',
    execute: async (bot, args, username) => {
      if (username === devName) {
        const player = args[1]
        const withdrawl = args[2]
        const user = await userManager.getUser(player)
  
        if (withdrawl > 0 && withdrawl <= user.balance) {
          await userManager.editUser(player, 'set', 'balance', user.balance - withdrawl)
          bot.whisper(player, `$${withdrawl} withdrawn`)
          bot.whisper(player, `Your new balance is $${user.balance - withdrawl}`)
          bot.whisper(devName, `Withdrew ${withdrawl} from ${player} ($${user.balance} to $${user.balance - withdrawl})`)
          bot.chat(`/pay ${player} ${withdrawl}`)
          console.log(`${player} withdrew $${withdrawl} (from $${user.balance} to $${user.balance - withdrawl})`)
        } else {
          bot.whisper(username, 'Please enter a valid withdrawl! Can you afford it?')
        }
      } else {
        bot.whisper(username, 'Contact 150cc on discord or ingame to withdraw funds!')
      }    
    }
  }
]

const commandQueue = [];

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

function getCommand(commandName) {
  return commands.find(command => command.name === commandName || command.aliases.includes(commandName))
}

export async function enqueueCommand(bot, commandName, commandArgs) {
  const command = getCommand(commandName)
  if (command.devOnly && commandArgs[0] !== devName) {
    bot.whisper(commandArgs[0], 'This command is for developers only!')
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
    await executeNextCommand(bot);
  }
}

async function executeNextCommand(bot) {
  if (commandQueue.length === 0) {
    return;
  }

  const { command, commandArgs } = commandQueue[0];

  try {
    await command.execute(bot, commandArgs, commandArgs[0]);
  } catch (error) {
    console.error(error);
  }

  commandQueue.shift();

  if (commandQueue.length > 0) {
    await executeNextCommand(bot);
  }
}
