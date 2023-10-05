import CasinoBot from './casino-bot.js'

export const bots = []

startBot({
  username: 'dharropalt1.7tons@slmail.me',
  auth: 'microsoft',
  host: 'og-network.net',
  port: '25565',
  version: '1.20',
  viewDistance: 3,
  hideErrors: false,
})

export function startBot (botArgs) {
  bots.push(new CasinoBot(botArgs))
}

export function stopBot (userIndex) {
  bots[userIndex].bot.quit()
  bots.splice(userIndex, 1)
}
