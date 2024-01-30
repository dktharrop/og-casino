import * as jsonManager from '../../json-manager.js'

export default {
  name: 'withdraw',
  aliases: ['w'],
  description: 'Withdraw your funds',
  skipQueue: true,
  devOnly: false,
  execute: async (casinoBot, args, username) => {
    const user = await jsonManager.getUser(username, casinoBot.gamemode)

    if (!user) {
      casinoBot.bot.tell(username, 'User not found!')
      return
    }

    // if (casinoManager.games.crash.players.find(player => player.username === username)) {
    //   casinoBot.bot.tell(username, 'You can\'t withdraw while playing crash!')
    //   return
    // }

    const botBalance = casinoBot.getBalance()
    casinoBot.log(botBalance)
    const withdrawl = args[0] ? Math.round(Number(args[0])) : user.balance

    if (withdrawl > botBalance) {
      casinoBot.bot.tell(username, 'The bot does not have enough funds!')
      return
    }

    if (!username || isNaN(withdrawl)) {
      casinoBot.bot.tell(username, 'Please enter valid arguments!')
      return
    }

    const newBalance = user.balance - withdrawl
    if (newBalance < 0) {
      casinoBot.bot.tell(username, 'You do not have enough funds to withdraw that amount!')
      return
    }

    if (withdrawl > 0 && withdrawl <= user.balance) {
      await jsonManager.editUser(username, 'set', 'balance', newBalance, casinoBot.gamemode)
      casinoBot.bot.tell(username, `Your new balance is $${newBalance.toLocaleString('en-US')}`)

      casinoBot.bot.chat(`/pay ${username} ${withdrawl}`)
      casinoBot.bot.tell(casinoBot.dev, `Withdrew ${withdrawl.toLocaleString('en-US')} from ${username} ($${user.balance.toLocaleString('en-US')} to $${newBalance.toLocaleString('en-US')})`)
      casinoBot.log(`${username} withdrew $${withdrawl.toLocaleString('en-US')} (from $${user.balance.toLocaleString('en-US')} to $${newBalance.toLocaleString('en-US')})`)
      casinoBot.log(`Bot balance: $${casinoBot.getBalance().toLocaleString('en-US')}`)
    } else {
      casinoBot.bot.tell(username, 'Please enter a valid withdrawal! Can you afford it?')
    }
  }
}
