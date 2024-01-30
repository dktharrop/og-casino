export default {
  name: 'disclaimer',
  aliases: ['dis'],
  description: 'Please read this!',
  skipQueue: false,
  devOnly: false,
  execute: (casinoBot, args, username) => {
    casinoBot.bot.tell(username, '------ DISCLAIMER ------')
    casinoBot.bot.tell(username, '⏵ This bot isn\'t affiliated with OGN.')
    casinoBot.bot.tell(username, '⏵ This bot is for entertainment,')
    casinoBot.bot.tell(username, '  but you could possibly lose money.')
    casinoBot.bot.tell(username, '⏵ Try not to take things too seriously')
    casinoBot.bot.tell(username, '  OG Network money has no real value.')
    casinoBot.bot.tell(username, '⏵ No refunds will be given out')
    casinoBot.bot.tell(username, '  unless you can prove a bug.')
    casinoBot.bot.tell(username, '⏵ Please be responsible!')
    casinoBot.bot.tell(username, '------------------------')
  }
}
