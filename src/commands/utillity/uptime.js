export default {
  name: 'uptime',
  aliases: ['u', 'up', 'ut'],
  description: 'See the ',
  skipQueue: true,
  devOnly: false,
  execute: (casinoBot, args, username) => {
    const uptime = process.uptime()
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor(uptime % 86400 / 3600)
    const minutes = Math.floor(uptime % 3600 / 60)
    const seconds = Math.floor(uptime % 60)

    casinoBot.bot.tell(username, `${days}d, ${hours}h, ${minutes}m, ${seconds}s`)
  }
}
