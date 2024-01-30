import * as jsonManager from '../../json-manager.js'

export default {
  name: 'profit',
  aliases: ['pf, pr, pt, pft'],
  description: 'Show net profit',
  skipQueue: true,
  devOnly: true,
  execute: async (casinoBot, args, username) => {
    const users = await jsonManager.getUsers(casinoBot.gamemode)
    const profitStat = jsonManager.getStats('profit', casinoBot.gamemode)

    let debt = 0
    for (let i = 0; i < users.length; i++) {
      debt += users[i].balance
    }
    debt += jsonManager.getStats('jackpot', casinoBot.gamemode)
    const balance = casinoBot.getBalance()
    const gross = balance + profitStat // this doesnt work with decimals
    const net = gross - debt
    casinoBot.bot.tell(username, `$${net.toLocaleString('en-US')}`)
  }
}
