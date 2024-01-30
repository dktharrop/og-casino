import * as jsonManager from '../../json-manager.js'

export default {
  name: 'balance',
  aliases: ['bal', 'b'],
  description: 'Display your balance',
  skipQueue: true,
  devOnly: false,
  execute: async (casinoBot, args, username) => {
    const user = await jsonManager.getUser(username, casinoBot.gamemode)
    casinoBot.bot.tell(username, `$${user.balance.toLocaleString('en-US')}`)
  }
}
