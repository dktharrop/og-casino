import * as jsonManager from '../../json-manager.js'

export default {
  name: 'topgains',
  aliases: ['gainstop', 'tg', 'gt', 'topg', 'gtop'],
  description: 'Shows highest earners',
  skipQueue: false,
  devOnly: false,
  execute: async (casinoBot, args, username) => {
    casinoBot.bot.tell(username, 'Getting the top 10 earnings...')

    const users = await jsonManager.getUsers(casinoBot.gamemode)
    users.sort((a, b) => b.gains - a.gains)

    // Get the top 10 users
    const top10 = users.slice(0, 10)

    // Get usernames for top 10 users
    const usernamePromises = top10.map(user => jsonManager.getUsername(user.uuid))
    const usernames = await Promise.all(usernamePromises)

    for (let i = 0; i < top10.length; i++) {
      casinoBot.bot.tell(username, `${usernames[i]}: $${top10[i].gains.toLocaleString('en-US')}`)
    }
  }
}
