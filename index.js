const fs = require('fs')
const Combinatorics = require('js-combinatorics')

const { Ext, Compare } = require('./hypotheses')


function getData() {

    const data = JSON.parse(fs.readFileSync('./data/output.json'))
    const day = 1000 * 60 * 60 * 24

    /**
     * 
     * TODO:
     * - данные, учесть пропасти между ними в алгоритме
     */

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

    return prices
}


class Algorithm {

    constructor(config, first, second, data) {
        this.first = first(data)
        this.second = second(data)
        this.config = config
        this.data = data
        this.m = config.m
    }

    processing() {
        console.log('Start processing')

        this.combs = Combinatorics.cartesianProduct(this.first.getCombs(this.m), 
            this.second.getCombs(this.m)).toArray().map((v, i) => {
                v.index = i
                return v
            })
    
        this.train()
    
        this.checkHypotheses()
    
        return {
            profit: this.profit,
            operations: this.operations
        }
    }

    train() {
        console.log('Start training')
        const generator = this.getGenerator(parseInt(this.data.length * this.config.trainVolume))
        let indeces
        while (indeces = generator.next()) {
            this.processRow(indeces)
        }

        this.clearHypotheses()
        this.setActiveHypoteses()
    }

    clearHypotheses() {
        /**
         * remove unnecessary hypotheses
         */
        const len = this.combs.length
        for (let i = 0; i < len; i++) {
            const index = len - 1 - i
            if (!this.combs[index].all) {
                this._remove(this.combs, index)
            }
        }
    }

    setActiveHypoteses() {
        this.active = []
        this.combs.forEach(r => this.checkHypotezesRequirements(r))
    }

    _remove(arr, i) {
        arr.splice(i, 1)
    }

    checkRequirementsUp(comb, i) {
        return ((comb.up[i]/comb.all > this.config.minProbality) ||
            ((comb.commulate_up[i]/comb.all - 1) > this.config.commulateBorder))
    }
    checkRequirementsDown(comb, i) {
        return ((comb.down[i]/comb.all > this.config.minProbality) || 
            ((comb.commulate_down[i]/comb.all - 1) > this.config.commulateBorder))
    }
    checkHypotezesRequirements(comb) {
        if (comb.all && comb.all > this.config.minCount) {
            for (let i = 0; i <= this.config.stepsAhead; i++) {
                if (this.checkRequirementsUp(comb, i)) {
                    this.active.push(this.getActiveBody(comb, 'up', i))
                }
                if (this.checkRequirementsDown(comb, i)) {
                    this.active.push(this.getActiveBody(comb, 'down', i))
                }
            }
        }
    }


    checkHypotezAgain(comb, j) {
        let active = []
        if (comb.all && comb.all > this.config.minCount) {
            for (let i = 0; i <= this.config.stepsAhead; i++) {
                if (this.checkRequirementsUp(comb, i)) {
                    active.push(this.getActiveBody(comb, 'up', i))
                }
                if (this.checkRequirementsDown(comb, i)) {
                    active.push(this.getActiveBody(comb, 'down', i))
                }
            }
        }

        this.active = this.active.filter(e => e.index != j).concat(active)
    }

    getActiveBody(comb, type, i) {
        return {
            type: type,
            probability: comb.down[i]/comb.all,
            all: comb.all,
            val: [...comb],
            stepsAhead: i,
            index: comb.index,
            commulation: type == 'up' ? comb.commulate_up[i] : comb.commulate_down[i]
        }
    }

    processRow(indeces, isTrain = true) {
        const lastIndex = indeces[indeces.length - 1]
    
        this.combs.forEach((c, j) => {
            if (this.first.check(c[0], indeces) && this.second.check(c[1], indeces)) {
                
                if (!c.all) {
                    c.all = 1
                } else {
                    c.all++
                }

                // up and down init
                
                if (!c.up) {
                    c.up = {}
                    for (let i = 1; i <= this.config.stepsAhead; i++) {
                        c.up[i] = 0
                    }
                }

                if (!c.down) {
                    c.down = {}
                    for (let i = 1; i <= this.config.stepsAhead; i++) {
                        c.down[i] = 0
                    }
                }

                // commulate init
                
                if (!c.commulate_up) {
                    c.commulate_up = {}
                    for (let i = 1; i <= this.config.stepsAhead; i++) {
                        c.commulate_up[i] = 1
                    }
                }

                if (!c.commulate_down) {
                    c.commulate_down = {}
                    for (let i = 1; i <= this.config.stepsAhead; i++) {
                        c.commulate_down[i] = 1
                    }
                }

                // check results 

                for (let i = 1; i <= this.config.stepsAhead; i++) {
                    if (this.data.length > lastIndex + i) {
                        if (this.data[lastIndex] < this.data[lastIndex + i]) {
                            c.up[i]++
                        } else {
                            c.down[i]++
                        }

                        c.commulate_up[i] = c.commulate_up[i] * this.data[lastIndex + i] / this.data[lastIndex]

                        c.commulate_down[i] = c.commulate_down[i] * this.data[lastIndex] / this.data[lastIndex + i]
                    }
                }

                if (!isTrain) {
                    this.checkHypotezAgain(c, j)
                }
            }
        })
    }

    checkRow(indeces) {

        const lastIndex = indeces[indeces.length - 1]
        let up = false
        let down = false
        let obj
        let steps
        let probability

        try {
            this.active.forEach(c => {
                if (this.first.check(c[0], indeces) && this.second.check(c[1], indeces)) {

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
                }
            })
        } catch(err) {
            up = false
            down = false
        }

        const operation = {}

        if (up) {
            operation.profit = this.data[lastIndex + steps] / this.data[lastIndex]
        } else if (down) {
            operation.profit = this.data[lastIndex] / this.data[lastIndex + steps]
        }

        if (operation.profit) {
            operation.obj = obj
            operation.steps = steps
            this.profit = this.profit * operation.profit
            this.operations.push(operation)
            this.nextStepFrom = indeces[0] + steps - 1
        }
    }

    checkHypotheses() {
        this.profit = 1
        this.operations = []
    
        const generator = this.getGenerator(undefined, parseInt(this.data.length * this.config.trainVolume) + 1)
        let indeces
        while (indeces = generator.next()) {
            if (!this.nextStepFrom || this.nextStepFrom <= indeces[0]) {
                this.checkRow(indeces)
            }
            this.processRow(indeces, false)
        }
    }

    getGenerator(limit, from = 0) {
        if (!limit) {
            limit = this.data.length
        }
        let i = from - 1
        function next() {
            i = i + 1
            if ((i + this.m < limit) && (i + this.m < this.data.length)) {
                return (new Array(this.m).fill(0)).map((v, j) => j + i)
            } else {
                return false
            }
        }
    
        function add(n) {
            i = i + n
        }
    
        return {
            next: next.bind(this),
            add: add.bind(this)
        };
    }
}


const config = {
    compareLimit: 6,
    minCount: 20,
    minProbality: 0.70,
    commulateBorder: 0.005,
    trainVolume: 0.75,
    stepsAhead: 5,
    m: 3
}


const alg = new Algorithm(config, Ext, Compare, getData())

const result = alg.processing()

fs.writeFileSync('./data/result3.json', JSON.stringify(result))

console.log()