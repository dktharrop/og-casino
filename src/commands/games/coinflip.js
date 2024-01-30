export default {
  name: 'coinflip',
  aliases: ['cf'],
  description: 'Coinflip game',
  skipQueue: false,
  devOnly: true,
  execute: async (casinoBot, args, username) => {
    casinoBot.bot.tell(username, 'coming soon... or not...')

    // const player = args[0] ? args[0] : false
    // if (args[1] === 'challenge') {
    //   if (!player || !casinoBot.bot.players[player]) {
    //     casinoBot.bot.tell(username, 'Please enter a valid player!')
    //     return
    //   }
    //   casinoBot.bot.tell(username, `Request sent to ${player}! They have 30 seconds to accept.`)
    //   casinoBot.bot.tell(player, `${username} has challenged you to a coinflip! You $coinflip accept to accept. The request will expire in 30 seconds.`)

    //   setTimeout(() => {
    //     if (casinoBot.bot.players[player]) {
    //       casinoBot.bot.tell(player, 'The request has expired.')
    //     }
    //   }, 30000)
    // }
    // if (args[1] === 'accept') {

    // }
  }
}
