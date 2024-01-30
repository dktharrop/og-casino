import * as jsonManager from '../../json-manager.js'

export default {
  name: 'pay',
  aliases: ['p'],
  description: 'Add funds to a user\'s account',
  skipQueue: true,
  devOnly: true,
  execute: async (casinoBot, args, username) => {
    const recipient = args[0]
    const payment = Number(args[1])

    if (payment > 0) {
      await jsonManager.editUser(recipient, 'add', 'balance', payment, casinoBot.gamemode)
      casinoBot.bot.tell(username, `$${payment.toLocaleString('en-US')} has been added to your account`)
      casinoBot.log(`${username} added $${payment.toLocaleString('en-US')} to their account`)
    } else {
      casinoBot.bot.tell(username, 'Please enter a valid payment!')
    }
  }
}
