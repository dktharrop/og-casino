import * as jsonManager from '../../json-manager.js'

export default {
  name: 'cashout',
  aliases: ['co'],
  description: 'Cash out funds',
  skipQueue: true,
  devOnly: true,
  execute: (casinoBot, args, username) => {
    const botBalance = casinoBot.getBalance()
    let payment = 0
    if (args[0]) {
      payment = Math.round(Number(args[0]))
    } else {
      payment = botBalance
    }

    if (isNaN(payment)) {
      casinoBot.bot.tell(username, 'Please enter valid arguments!')
      return
    }

    const newBalance = botBalance - payment
    if (newBalance < 0) {
      casinoBot.bot.tell(username, 'The bot does not have enough funds!')
      return
    }

    if (payment > 0 && payment <= botBalance) {
      jsonManager.editStats('add', 'profit', payment, casinoBot.gamemode)
      casinoBot.bot.chat(`/pay ${username} ${payment}`)
      casinoBot.bot.tell(username, `Cashed out $${payment.toLocaleString('en-US')} (from $${botBalance.toLocaleString('en-US')} to $${newBalance.toLocaleString('en-US')})`)

      casinoBot.log(`${username} Cashed out $${payment.toLocaleString('en-US')} (from $${botBalance.toLocaleString('en-US')} to $${newBalance.toLocaleString('en-US')})`)
    } else {
      casinoBot.bot.tell(username, 'Please enter a valid cashout! Can you afford it?')
    }
  }
}
