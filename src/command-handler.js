import * as userManager from './user-manager.js'
import slots from './games/slots.js'

const queue = []
let isProcessing = false

export function enqueueCommand(command) {
  const bot = command.bot
  const username = command.args[0]
  const position = queue.length + 1
  let inQueue = false

  // Check if user is already in the queue
  const commandsInQueue = queue.filter(item => item.args[0] === username)
  if (commandsInQueue.length > 0) {
    bot.whisper(username, `You are already queued! You are in position ${position}`);
    inQueue = true
  }

  if (!inQueue) {
    queue.push(command)
    if (queue.length > 1) {
      bot.whisper(username, `You have been added to the queue! You are in position ${position}`)
    }
  }
  if (!isProcessing) {
    processQueue()
  }
}

async function processQueue () {
  isProcessing = true
  while (queue.length > 0) {
    const command = queue.shift()
    const bot = command.bot
    const name = command.name
    const args = command.args

    await executeCommand(bot, name, args)
  }
  isProcessing = false;
}

export function parseCommand(username, input) {
  const commandMatch = input.match(/^\$\w+/)
  if (!commandMatch) {
    return false;
  }

  const commandName = commandMatch[0].slice(1)
  const commandArgs = input.slice(commandName.length + 1).split(/\s+/).filter(arg => arg !== '')
  commandArgs.unshift(username)

  return {
    name: commandName,
    args: commandArgs,
  }
}

async function executeCommand(bot, name, args) {
  const command = getCommand(name)
  const username = args.shift()

  await command.execute(bot, args, username)
}

function getCommand(name) {
  return commands.find(command => command.name === name || command.aliases.includes(name))
}

const commands = [
  // general commands
  {
    name: 'bal',
    aliases: [],
    description: 'Display your balance',
    execute: async (bot, args, username) => {
      const user = await userManager.getUser(username)
      bot.whisper(username, `$${user.balance}`)
    }
  },
  {
    name: 'baltop',
    aliases: [ 'bt' ],
    description: 'Show a list of top balances',
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
    execute: async (bot, args, username) => {
      console.log(args)
      if (args[0]) {
        const newBet = Number(args[0])
        console.log(args[0])
        if (newBet >= 100 && newBet < 1000000) {
          await userManager.editUser(username, 'set', 'bet', newBet)
          bot.whisper(username, `Your bet has been set to $${newBet}`)
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
    name: 'help',
    aliases: [ 'h' ],
    description: 'Usage info',
    execute: (bot, args, username) => {
      commands.forEach((command) => {
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
    execute: async (bot, args, username) => {
      bot.whisper(username, 'Coming soon!')
    }
  },
  {
    name: 'slots',
    aliases: [ 's' ],
    description: 'Slots game',
    execute: async (bot, args, username) => {
      await slots(bot, username)
    }
  },
  // developer commands
  {
    name: 'profit',
    aliases: [ 'p' ],
    description: 'Show net profit',
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
          bot.whisper('150cc', `$${net.toLocaleString("en-US")}`)
        }
      })
    }
  },
  {
    name: 'withdraw',
    aliases: [ 'w' ],
    description: 'Withdraw your funds',
    execute: async (bot, args, username) => {
      if (username === '150cc') {
        const player = args[0]
        const withdrawl = args[1]
        const user = await userManager.getUser(player)
  
        console.log(user.balance)
        console.log(user)
  
        if (withdrawl > 0 && withdrawl <= user.balance) {
          await userManager.editUser(player, 'set', 'balance', user.balance - withdrawl)
          bot.whisper(player, `$${withdrawl} withdrawn`)
          bot.whisper(player, `Your new balance is $${user.balance - withdrawl}`)
          bot.whisper('150cc', `Withdrew ${withdrawl} from ${player} ($${user.balance} to $${user.balance - withdrawl})`)
          bot.chat(`/pay ${player} ${withdrawl}`)
        } else {
          bot.whisper(username, 'Please enter a valid withdrawl! Can you afford it?')
        }
      } else {
        bot.whisper(username, 'Contact 150cc on discord or ingame to withdraw funds!')
      }    
    }
  }
]