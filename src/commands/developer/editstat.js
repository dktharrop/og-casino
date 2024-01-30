import * as jsonManager from '../../json-manager.js'

export default {
  name: 'editstat',
  aliases: ['es'],
  description: 'Edit a stat',
  skipQueue: true,
  devOnly: true,
  execute: (casinoBot, args, username) => {
    const stat = args[0]
    const action = args[1]
    const value = Number(args[2])

    if (!stat || !action || isNaN(value)) {
      casinoBot.bot.tell(username, 'Please enter valid arguments!')
      return
    }

    jsonManager.editStats(action, stat, value, casinoBot.gamemode)
    casinoBot.bot.tell(username, `Edited ${stat} by ${value}`)
  }
}
