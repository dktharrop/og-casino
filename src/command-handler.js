import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import casinoManager from './main.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const foldersPath = path.join(__dirname, 'commands')
const commandFolders = fs.readdirSync(foldersPath)
const commands = []

async function loadCommands () {
  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder)
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file)
      const commandModule = await import(pathToFileURL(filePath).href)
      const command = commandModule.default || commandModule
      command.category = folder
      commands.push(command)
    }
  }
}

loadCommands().catch(error => console.error(error))

export default commands

const commandQueue = []

// queue system
export function getCommand (commandName) {
  try {
    const command = commands.find(command => command.name === commandName)
    if (command) {
      return command
    } else {
      return commands.find(command => command.aliases && command.aliases.includes(commandName))
    }
  } catch (error) {
    console.error(error)
  }
}

export async function enqueueCommand (casinoBot, commandName, commandArgs, username) {
  const command = getCommand(commandName)
  if (casinoManager.devMode === 'true' && !casinoBot.testers.includes(username)) {
    casinoBot.bot.tell(username, 'The bot is in dev mode! Commands are disabled for now.')
  }

  if (command.devOnly && (username !== casinoManager.devName)) {
    casinoBot.log(`${username} tried to run developer command ${command.name}`)
    casinoBot.bot.tell(username, 'This command is for developers only!')
    return
  }

  if (commandQueue.find(commandObject => commandObject.username === username)) {
    if (commandQueue[0] && commandQueue[0].username === username) {
      casinoBot.bot.tell(username, 'You are already running a command!')
      return
    } else {
      casinoBot.bot.tell(username, `You are already in the queue! You are in position ${commandQueue.length - 1}`)
      return
    }
  } else if (commandArgs) {
    commandQueue.push({ command, commandArgs, username })
    if (commandQueue.length > 1) {
      casinoBot.bot.tell(username, `You have been added to the queue! You are in position ${commandQueue.length - 1}`)
    }
  }

  if (commandQueue.length === 1) {
    await executeNextCommand(casinoBot)
  }
}

async function executeNextCommand (casinoBot) {
  if (commandQueue.length === 0) {
    return
  }

  const { command, commandArgs, username } = commandQueue[0]

  if (!command.skipQueue) {
    casinoManager.setUserStatus(username, command.name)
  }

  try {
    await command.execute(casinoBot, commandArgs, username)
  } catch (error) {
    console.error(error)
  }

  commandQueue.shift()
  casinoManager.setUserFree(username)

  if (commandQueue.length > 0) {
    await executeNextCommand(casinoBot)
  }
}
