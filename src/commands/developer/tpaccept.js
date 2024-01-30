export default {
  name: 'tpaccept',
  aliases: [],
  description: 'Accept a teleport request',
  skipQueue: true,
  devOnly: true,
  execute: (casinoBot, args, username) => {
    if (!args[0]) {
      casinoBot.bot.tell(username, 'Please enter valid arguments!')
      return
    }
    casinoBot.bot.chat(`/tpaccept ${args[0]}`)
  }
}
