import * as jsonManager from '../../json-manager.js'

export default {
  name: 'baltop',
  aliases: ['bt'],
  description: 'Show a list of top balances',
  skipQueue: false,
  devOnly: false,
  execute: async (casinoBot, args, username, gamemode) => {
    casinoBot.bot.tell(username, 'Getting the top 10 balances...')

    const users = await jsonManager.getUsers(casinoBot.gamemode)
    users.sort((a, b) => b.balance - a.balance)

    // Get the top 10 users
    const top10 = users.slice(0, 10)

    // Get usernames for top 10 users
    const usernamePromises = top10.map(user => jsonManager.getUsername(user.uuid))
    const usernames = await Promise.all(usernamePromises)

    for (let i = 0; i < top10.length; i++) {
      casinoBot.bot.tell(username, `${usernames[i]}: $${top10[i].balance.toLocaleString('en-US')}`)
    }
  }
}
