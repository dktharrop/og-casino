export default {
  name: 'ping',
  aliases: ['p', 'pi'],
  description: 'Shows bot ping to the server',
  skipQueue: true,
  devOnly: false,
  execute: async (casinoBot, args, username) => {
    const ping = await casinoBot.getPing()
    casinoBot.bot.tell(username, `Pong! (${ping}ms)`)
  }
}
