import * as jsonManager from '../../json-manager.js'

export default {
  name: 'daily',
  aliases: ['da'],
  description: 'Claim your daily reward',
  skipQueue: true,
  devOnly: false,
  execute: async (casinoBot, args, username) => {
    const daily = 1000
    const user = await jsonManager.getUser(username, casinoBot.gamemode)

    const now = Math.floor(Date.now() / 1000)
    if (now - user.lastDaily >= 86400) {
      await jsonManager.editUser(username, 'add', 'balance', daily, casinoBot.gamemode)
      await jsonManager.editUser(username, 'add', 'gains', daily, casinoBot.gamemode)
      await jsonManager.editUser(username, 'set', 'lastDaily', now, casinoBot.gamemode)
      casinoBot.bot.tell(username, `You have claimed your daily reward of $${daily}!`)
      casinoBot.log(`${username} claimed their daily reward of $${daily}!`)
    } else {
      const timeLeft = 86400 - (now - user.lastDaily)
      const hours = Math.floor(timeLeft / 3600)
      const minutes = Math.floor((timeLeft - (hours * 3600)) / 60)
      const seconds = timeLeft - (hours * 3600) - (minutes * 60)
      casinoBot.bot.tell(username, `You can claim your daily reward in${(hours > 0) ? ` ${hours} hours,` : ''}${(minutes > 0) ? ` ${minutes} minutes,` : ''}${(seconds > 0) ? ` ${seconds} seconds` : ''}`)
    }
  }
}
