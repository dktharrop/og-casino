import fs from 'fs'
import fetch from 'node-fetch'

export function editStats (editType, property, value) {
  const statsData = fs.readFileSync('stats.json')
  const stats = JSON.parse(statsData)

  if (editType === 'set') {
    stats[property] = value
  } else if (editType === 'add') {
    stats[property] += value
  } else if (editType === 'subtract') {
    stats[property] -= value
  }

  const updatedData = JSON.stringify(stats)
  fs.writeFileSync('stats.json', updatedData)
}

export function getStats (stat) {
  const statsData = fs.readFileSync('stats.json')
  const stats = JSON.parse(statsData)

  return stats[stat]
}

export async function editUser (username, editType, property, value) {
  const usersData = fs.readFileSync('users.json')
  const users = JSON.parse(usersData)

  const uuid = await getUUID(username)

  let userIndex = users.findIndex(user => user.uuid === uuid)

  if (userIndex === -1) {
    const newUser = await createUser(uuid)
    users.push(newUser)
    userIndex = users.length - 1
  }

  let user = users[userIndex]

  if (editType === 'set') {
    user[property] = value
  } else if (editType === 'add') {
    user[property] += value
  } else if (editType === 'subtract') {
    user[property] -= value
  }

  users[userIndex] = user

  const updatedData = JSON.stringify(users)
  fs.writeFileSync('users.json', updatedData)
}

export async function getUser (username) {
  const usersData = fs.readFileSync('users.json')
  const users = JSON.parse(usersData)

  const uuid = await getUUID(username)

  const user = users.find(user => user.uuid === uuid)

  if (user) {
    return user
  } else {
    return await createUser(uuid)
  }
}

export async function getUsers () {
  const usersData = fs.readFileSync('users.json')
  return JSON.parse(usersData)
}

export async function getUUID (username) {
  return await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
    .then(response => response.json())
    .then(data => data.id)
}

export async function getUsername (uuid) {
  return await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)
    .then(response => response.json())
    .then(data => data.name);
}

export async function createUser (uuid) {
  const usersData = fs.readFileSync('users.json')
  const users = JSON.parse(usersData)

  const newUser = {
    uuid,
    balance: 0,
    bet: 100,
    gains: 0,
    loss: 0
    // other properties
  }

  users.push(newUser)

  const updatedData = JSON.stringify(users)
  fs.writeFileSync('users.json', updatedData)

  return newUser
}
