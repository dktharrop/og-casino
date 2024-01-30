import * as jsonManager from '../../json-manager.js'

export default {
  name: 'bet',
  aliases: ['b'],
  description: 'View or change your bet',
  skipQueue: true,
  devOnly: false,
  execute: async (casinoBot, args, username) => {
    if (args[0]) {
      // const crashPlayer = casinoManager.games.crash.players.find(player => player.username === username)
      // if (crashPlayer && (crashPlayer.state === 'playing' || crashPlayer.state === 'claimed' || crashPlayer.state === 'joining')) {
      //   casinoBot.bot.tell(username, 'You can only change your bet while spectating!')
      //   return
      // }
      const newBet = Math.round(Number(args[0]))
      if (newBet >= 50 && newBet <= 250000) {
        await jsonManager.editUser(username, 'set', 'bet', newBet, casinoBot.gamemode)
        casinoBot.bot.tell(username, `Your bet has been set to $${newBet.toLocaleString('en-US')}`)
        casinoBot.log(`${username} changed their bet to $${newBet.toLocaleString('en-US')}`)
      } else if (newBet < 100) {
        casinoBot.bot.tell(username, 'The minimum bet is $50!')
      } else if (newBet > 250000) {
        casinoBot.bot.tell(username, 'The maximum bet is $250,000!')
      } else {
        casinoBot.bot.tell(username, 'Please enter a valid bet!')
      }
    } else {
      const user = await jsonManager.getUser(username, casinoBot.gamemode)
      casinoBot.bot.tell(username, `Your bet is $${user.bet.toLocaleString('en-US')}`)
    }
  }
}
