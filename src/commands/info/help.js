import commands from '../../command-handler.js'

export default {
  name: 'help',
  aliases: ['h'],
  description: 'Usage info',
  skipQueue: false,
  devOnly: false,
  execute: (casinoBot, args, username) => {
    casinoBot.log(`${username} used $help`)

    if (!args[0]) {
      casinoBot.bot.tell(username, '--------- HELP ---------')
    }
    // programatic hyphens

    // Filter commands based on the argument provided
    const filteredCommands = commands.filter(command => command.category === args[0])

    filteredCommands.forEach((command) => {
      if (command.devOnly) return
      casinoBot.bot.tell(username, `$${command.name} | ${command.description}`)
    })

    casinoBot.bot.tell(username, '------------------------')
    casinoBot.bot.tell(username, 'Pay the bot to add funds to your account and get started!')
    casinoBot.bot.tell(username, 'Still confused? Join the discord for help! https://discord.gg/zAAtQy3DG5')
  }
}
