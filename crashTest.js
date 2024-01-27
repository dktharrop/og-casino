// Define the number of trials
const million = 1000000
const trials = 100 * million
const bet = 10000

// Define the total winnings
let crashSum = 0
let winningsSum = 0
let lossSum = 0
let netSum = 0
let instantCrash = 0
let maxCrash = 0

function getCrashPoint () {
  const r = Math.random()

  const e = 2 ** 32
  const h = r * e

  if (r < 0.08) {
    instantCrash = 0
    return 0
  }

  const crashPoint = Math.floor((50 * e - h) / (e - h)) / 100
  if (crashPoint > 50) return (50 + Math.random())
  return (crashPoint < 1) ? (crashPoint + 0.5 * (1 - crashPoint) + 0.5) : crashPoint
}

// Run the simulation
for (let trial = 0; trial < trials; trial++) {
  // Reset the game state
  const crashPoint = getCrashPoint()
  const winnings = bet * 1.05 * instantCrash

  // Update the total winnings
  crashSum += crashPoint
  winningsSum += winnings
  lossSum += bet
  netSum = winningsSum - lossSum

  instantCrash = 1
  if (crashPoint > maxCrash) {
    maxCrash = crashPoint
  }
}

// Calculate the average winnings
const averageCrash = crashSum / trials
const averageWinnings = winningsSum / trials
const averageLoss = lossSum / trials
const averageNet = netSum / trials

console.log(crashSum)

console.log(`Average Crash: ${averageCrash}`)
console.log(`Average Winnings: ${averageWinnings}`)
console.log(`Average Loss: ${averageLoss}`)
console.log(`Average Net: ${averageNet}`)

console.log(`Net: ${netSum}`)

console.log(`Max Crash: ${maxCrash}`)
