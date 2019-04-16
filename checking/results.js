const fs = require('fs')

const result = JSON.parse(fs.readFileSync('./data/cartes3.json'))

let minCount = 40;
let minProbality = 0.75;

let commulateBorder = 2;

let arr = []
result.forEach((r, j) => {
    if (r.all > minCount) {
        for (let i = 0; i < 5; i++) {
            if ((r.up[i]/r.all > minProbality) || (r.commulate_up[i] > commulateBorder)) {
                arr.push({
                    type: 'up',
                    probability: r.up[i]/r.all,
                    all: r.all,
                    val: r.val,
                    daysAhead: i,
                    index: j,
                    commulation: r.commulate_up[i]
                })
            }
            if ((r.down[i]/r.all > minProbality) || (r.commulate_down[i] > commulateBorder)) {
                arr.push({
                    type: 'down',
                    probability: r.down[i]/r.all,
                    all: r.all,
                    val: r.val,
                    daysAhead: i,
                    index: j,
                    commulation: r.commulate_down[i]
                })
            }
        }
    }
})

arr = arr.sort((a, b) => b.commulation - a.commulation)

fs.writeFileSync('./data/result3.json', JSON.stringify(arr))
console.log()
