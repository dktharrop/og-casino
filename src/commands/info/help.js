import commands from '../../command-handler.js'

export default {
  name: 'help',
  aliases: ['h'],
  description: 'Usage info',
  skipQueue: false,
  devOnly: false,
  execute: (casinoBot, args, username) => {
    if (!args[0]) {
      casinoBot.bot.tell(username, '---------- HELP ---------')
      casinoBot.bot.tell(username, 'Commands are split into categories')
      casinoBot.bot.tell(username, 'Use $help <category> to see commands in that category')
      casinoBot.bot.tell(username, '-------------------------')
      casinoBot.bot.tell(username, 'games | Commands for playing games')
      casinoBot.bot.tell(username, 'info | Commands with general info')
      casinoBot.bot.tell(username, 'stats | Commands for viewing stats')
      casinoBot.bot.tell(username, 'user | Commands for managing your account')
      casinoBot.bot.tell(username, 'utility | Commands for misc. things')
    }

    // Filter commands based on the argument provided
    if (args[0]) {
      const filteredCommands = commands.filter(command => command.category === args[0])

      if (filteredCommands.length === 0) {
        casinoBot.bot.tell(username, 'That is not a valid category!')
        return
      }

      // Create a string of hyphens to center the category name, making sure the divider is the same length as the bottom divider
      const leftHyphens = '-'.repeat(Math.floor((24 - args[0].length) / 2))
      const rightHyphens = '-'.repeat(Math.ceil((24 - args[0].length) / 2))

      casinoBot.bot.tell(username, `${leftHyphens} ${args[0].toUpperCase()} ${rightHyphens}`)

      filteredCommands.forEach((command) => { // add more robust help text in the command objects later
        if (command.devOnly) return
        casinoBot.bot.tell(username, `$${command.name} | ${command.description}`)
      })
    }

    casinoBot.bot.tell(username, '-------------------------')
    casinoBot.bot.tell(username, 'Pay the bot to add funds!')
    casinoBot.bot.tell(username, 'Join the discord for more help!')
    casinoBot.bot.tell(username, 'https://discord.gg/zAAtQy3DG5')
  }
}
