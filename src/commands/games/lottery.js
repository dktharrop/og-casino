export default {
  name: 'lottery',
  aliases: ['l'],
  description: 'Enter the lottery',
  skipQueue: true,
  devOnly: true,
  execute: async (casinoBot, args, username) => {
    casinoBot.bot.tell(username, "The lottery isn't running right now!")

    // const user = await jsonManager.getUser(username, casinoBot.gamemode)
    // const purchase = args[0] ? Math.round(Number(args[0])) : false
    // const ticketCost = 1000

    // if ((isNaN(purchase) || purchase <= 0) && purchase !== false) {
    //   casinoBot.bot.tell(username, 'Please enter valid arguments!')
    //   return
    // }

    // if (purchase === false) {
    //   const jackpot = jsonManager.getStats('jackpot', casinoBot.gamemode)
    //   casinoBot.bot.tell(username, `Each ticket costs $${formatInt(ticketCost)}`)
    //   casinoBot.bot.tell(username, `You have ${user.tickets} ticket${(user.tickets === 1) ? '' : 's'}`)
    //   casinoBot.bot.tell(username, `The jackpot is currently $${formatInt(jackpot)}`)
    //   casinoBot.bot.tell(username, 'You can buy tickets with $lottery <amount>')
    //   casinoBot.bot.tell(username, 'Each ticket gives you another entry in the draw!')
    //   return
    // }

    // const cost = ticketCost * purchase

    // if (user.balance < (cost)) {
    //   casinoBot.bot.tell(username, 'You can\'t afford that many tickets!')
    //   return
    // }

    // await jsonManager.editUser(username, 'subtract', 'balance', cost, casinoBot.gamemode)
    // await jsonManager.editUser(username, 'add', 'loss', cost, casinoBot.gamemode)
    // await jsonManager.editUser(username, 'add', 'tickets', purchase, casinoBot.gamemode)
    // jsonManager.editStats('add', 'jackpot', cost * 0.9, casinoBot.gamemode)
    // casinoBot.bot.tell(username, `You purchased ${purchase} ticket${(purchase === 1) ? '' : 's'} for $${formatInt(cost)}`)
    // casinoBot.bot.tell(username, `You now have ${user.tickets + purchase} ticket${(user.tickets + purchase === 1) ? '' : 's'} total, good luck!`)
    // casinoBot.log(`${username} bought ${purchase} ticket${(purchase === 1) ? '' : 's'}`)
  }
}
