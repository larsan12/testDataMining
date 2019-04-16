const fs = require('fs')
const Combinatorics = require('js-combinatorics')
var combinations = require('combinations')

const data = JSON.parse(fs.readFileSync('./data/output.json'))
const day = 1000 * 60 * 60 * 24

/**
 * 
 * TODO:
 * - данные, учесть пропасти между ними в алгоритме
 */


const minCount = 20;
const minProbality = 0.60;
const commulateBorder = 1.3;
const trainVolume = 0.75;

function parseData(data) {
    let newData =[]
    let lastDate
    let lastDay
    Object.keys(data).sort().forEach(k => {
        if (!lastDate) {
            lastDate = k
            newData.push({
                ...data[k],
                day: 0
            })
            lastDay = 0
        } else {
            let days = (k - lastDate)/day
            lastDate = k
            lastDay = days + lastDay
            newData.push({
                ...data[k],
                day: parseInt(lastDay)
            })
        }
    })

    return newData
}

const newData = parseData(data)

const prices = newData.map(obj => {
    /*return {
        day: obj.day,
        price: obj.exchange.price
    }*/
    return obj.exchange.price
})


// predicats
const compare = (a, b) => {
    return a > b
}

const ext = (arr, i, short = false) => {
    if (i < 1 || i > arr.length - 2) {
        short = true
    }
    if (short) {
        return arr[i] > arr[i - 1] ? 1 : -1
    } else {
        if ((arr[i] > arr[i - 1]) && (arr[i] > arr[i + 1])) {
            return 1
        } else if ((arr[i] < arr[i - 1]) && (arr[i] < arr[i + 1])) {
            return -1
        }
        return 0
    }
}

// arg - m
// ext and compare

const compareLimit = 6

function hypotez(m) {
    const vars = (new Array(m).fill(0)).map((v, i) => i)
    console.log(vars)

    // ext combinations
    const extComb = Combinatorics.baseN([0, -1, 1], m)
    
    // compare combinations
    let compareCombs = Combinatorics.permutation(vars).toArray()
    
    compareCombs = compareCombs.map(comp => {
        const result = []
        for (let i = 1; i < comp.length; i++) {
            result.push([comp[i - 1], comp[i]])
        }
        return result
    })

    const result = Combinatorics.cartesianProduct(extComb.toArray(), compareCombs);

    const hypotezes = findHypotez(result.toArray(), m)

    const checking = checkHypotezes(hypotezes, m)

    return checking

}

console.log()

function checkHypotezes(hypotezes, m) {
    let profit = 1
    let operations = []

    const generator = getGenerator(prices, m, undefined, parseInt(prices.length * trainVolume) + 1)
    let indeces
    while (indeces = generator.next()) {
        const mapExt = indeces.map((v, i) => {
            if (i === indeces.length - 1) {
                return ext(prices, v, true)
            }
            return ext(prices, v)
        })
        const lastIndex = indeces[indeces.length - 1]

        let up = false
        let down = false
        let obj
        let steps
        let probability

        try {
            hypotezes.forEach(c => {
                try {
                    let ext = c.val[0]
                    let compare = c.val[1]
                    mapExt.forEach((v, i) => {
                        if (v != ext[i]) {
                            throw new Error('not okay')
                        }
                    })

                    compare.forEach(v => {
                        if (prices[indeces[v[0]]] <= prices[indeces[v[1]]]) {
                            throw new Error('not okay')
                        }
                    })

                    if (c.type === up) {
                        up = true
                    } else {
                        down = true
                    }

                    if (up && down) {
                        throw new Error('collision')
                    }

                    if (!steps || (probability < c.probability)) {
                        obj = c
                        steps = c.stepsAhead
                        probability = c.probability
                    }
                    
                } catch (err) {
                    if (err.message == 'collision') {
                        throw err
                    }
                }
            })
        } catch(err) {
            let err1 = err
        }

        const operation = {}

        if (up) {
            operation.profit = prices[lastIndex + steps] / prices[lastIndex]
        } else if (down) {
            operation.profit = prices[lastIndex] / prices[lastIndex + steps]
        }

        if (operation.profit) {
            operation.obj = obj
            operation.steps = steps
            profit = profit * operation.profit
            operations.push(operation)
            generator.add(steps - 1)
        }

    }

    return {
        profit,
        operations,
        steps: prices.length - parseInt(prices.length * trainVolume)
    }
}


function findHypotez(cartes, m) {
    const generator = getGenerator(prices, m, parseInt(prices.length * trainVolume))
    let indeces
    while (indeces = generator.next()) {
        const mapExt = indeces.map((v, i) => {
            if (i === indeces.length - 1) {
                return ext(prices, v, true)
            }
            return ext(prices, v)
        })
        const lastIndex = indeces[indeces.length - 1]

        cartes.forEach(c => {
            try {
                let ext = c[0]
                let compare = c[1]
                mapExt.forEach((v, i) => {
                    if (v != ext[i]) {
                        throw new Error('not okay')
                    }
                })

                compare.forEach(v => {
                    if (prices[indeces[v[0]]] <= prices[indeces[v[1]]]) {
                        throw new Error('not okay')
                    }
                })

                // count results

                // all
                if (!c.all) {
                    c.all = 1
                } else {
                    c.all++
                }

                // up and down init
                
                if (!c.up) {
                    c.up = {}
                    for (let i = 1; i < 6; i++) {
                        c.up[i] = 0
                    }
                }

                if (!c.down) {
                    c.down = {}
                    for (let i = 1; i < 6; i++) {
                        c.down[i] = 0
                    }
                }

                // commulate init
                
                if (!c.commulate_up) {
                    c.commulate_up = {}
                    for (let i = 1; i < 6; i++) {
                        c.commulate_up[i] = 1
                    }
                }

                if (!c.commulate_down) {
                    c.commulate_down = {}
                    for (let i = 1; i < 6; i++) {
                        c.commulate_down[i] = 1
                    }
                }

                // check results 

                for (let i = 1; i < 6; i++) {
                    if (prices.length > lastIndex + i) {
                        if (prices[lastIndex] < prices[lastIndex + i]) {
                            c.up[i]++
                        } else {
                            c.down[i]++
                        }

                        c.commulate_up[i] = c.commulate_up[i] * prices[lastIndex + i] / prices[lastIndex]

                        c.commulate_down[i] = c.commulate_down[i] * prices[lastIndex] / prices[lastIndex + i]
                    }
                }
            } catch (err) {
                let errr = err
            }
        })
    }

    const hypotezes = getHypotezes(cartes)

    return hypotezes

}

function getHypotezes(cartes) {
    const arr = []
    cartes.forEach((r, j) => {
        if (r.all > minCount) {
            for (let i = 0; i < 5; i++) {
                if ((r.up[i]/r.all > minProbality) && (r.commulate_up[i]/r.all > commulateBorder)) {
                    arr.push({
                        type: 'up',
                        probability: r.up[i]/r.all,
                        all: r.all,
                        val: [...r],
                        stepsAhead: i,
                        index: j,
                        commulation: r.commulate_up[i]
                    })
                }
                if ((r.down[i]/r.all > minProbality) && (r.commulate_down[i] > commulateBorder)) {
                    arr.push({
                        type: 'down',
                        probability: r.down[i]/r.all,
                        all: r.all,
                        val: [...r],
                        stepsAhead: i,
                        index: j,
                        commulation: r.commulate_down[i]
                    })
                }
            }
        }
    })

    return arr
}

function getGenerator(arr, m, limit, from = 0) {
    if (!limit) {
        limit = arr.length
    }
    let i = from - 1
    function next() {
        i = i + 1
        if ((i + m < limit) && (i + m < arr.length)) {
            return (new Array(m).fill(0)).map((v, j) => j + i)
        } else {
            return false
        }
    }

    function add(n) {
        i = i + n
    }

    return {
        next: next,
        add: add
    };
}

const result = hypotez(4)

fs.writeFileSync('./data/result3.json', JSON.stringify(result))

console.log()