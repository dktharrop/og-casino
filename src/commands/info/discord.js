export default {
  name: 'discord',
  aliases: ['dc'],
  description: 'Join the discord!',
  skipQueue: true,
  devOnly: false,
  execute: (casinoBot, args, username) => {
    casinoBot.bot.tell(username, 'Want to hear about updates?')
    casinoBot.bot.tell(username, 'Found a bug? Need help?')
    casinoBot.bot.tell(username, 'Join the discord!')
    casinoBot.bot.tell(username, 'https://discord.gg/zAAtQy3DG5')
  }
}
