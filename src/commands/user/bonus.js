import * as jsonManager from '../../json-manager.js'

export default {
  name: 'bonus',
  aliases: ['bon', 'bo'],
  description: 'Claim your welcome bonus',
  skipQueue: true,
  devOnly: false,
  execute: async (casinoBot, args, username) => {
    const bonus = 5000
    const user = await jsonManager.getUser(username, casinoBot.gamemode)

    if (user.bonus) {
      casinoBot.bot.tell(username, 'You have already claimed the welcome bonus!')
      return
    }

    await jsonManager.editUser(username, 'add', 'balance', bonus, casinoBot.gamemode)
    await jsonManager.editUser(username, 'add', 'gains', bonus, casinoBot.gamemode)
    await jsonManager.editUser(username, 'set', 'bonus', true, casinoBot.gamemode)
    casinoBot.bot.tell(username, `$${bonus} has been added to your account!`)
    casinoBot.log(`${username} claimed their welcome bonus of $${bonus}!`)
  }
}
