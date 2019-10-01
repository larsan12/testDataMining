const Combinatorics = require('js-combinatorics')


// TODO count commulation for operations

class Algorithm {
    
    constructor(config, data, ...predicates) {
        this.availableData = []
        this.predicates = predicates.map(p => p())
        this.config = config
        this.data = data
        this.stepsAhead = config.stepsAhead
        // for report
        this.comb_limit = config.comb_limit || 50
    }

    processing() {
        console.log('Start processing')

        this.combs = Combinatorics.cartesianProduct(...this.predicates.map(p => p.getCombs()))
            .toArray()
            .reduce((res, v, i) => {
                v.string = this.predicates.map((p, j) => p.getString(v[j])).join(' & ')
                res[v.map(row => row.id).join('')] = v
                return res
            }, {})
    
        this.train()
    
        this.checkHypotheses()

        this.removeUnnecessaryDependencies()
    
        return {
            profit: this.profit,
            operations: this.operations,
            config: this.config,
            combs: Object.keys(this.combs)
                .sort((a, b) => this.combs[b].all - this.combs[a].all)
                .slice(0, this.comb_limit)
                .map(key => {
                    const v = this.combs[key]
                    return {
                        val: [...v],
                        all: v.all,
                        commulate_down: v.commulate_down,
                        commulate_hist_down: v.commulate_hist_down,
                        commulate_hist_up: v.commulate_hist_up,
                        commulate_up: v.commulate_up,
                        down: v.down,
                        string: v.string,
                        up: v.up
                    }
                })
        }
    }

    removeUnnecessaryDependencies() {
        this.operations.forEach(v => {
            delete v.obj.comb
        })
    }

    pushNewData(numberRows) {
        this.availableData = this.availableData.concat(
            this.data.slice(this.availableData.length, this.availableData.length + numberRows)
        );
    }

    train() {
        console.log('Start training')
        const len = parseInt(this.data.length * this.config.trainVolume)
        let i = this.stepsAhead
        this.pushNewData(i + 1)
        while (i <= len) {
            if (i % 100 === 0) {
                console.log(`progress: ${i}/${this.data.length}`)
            }
            this.processRow(i - this.stepsAhead)
            i++
            this.pushNewData(1)
        }

        this.clearHypotheses()
        
        // set active
        this.active = this.getActiveByTopCriteria(len)
        console.log('active count: ' + this.active.length)
    }

    checkHypotheses() {
        this.profit = 1
        this.operations = []
        let i = this.availableData.length
        this.pushNewData(1)
        while (i < this.data.length) {
            if (i % 100 === 0) {
                console.log(`progress: ${i}/${this.data.length}`)
            }
            if (!this.nextStepFrom || this.nextStepFrom <= i) {
                this.checkRow(i)
            }
            this.processRow(i - this.stepsAhead, false)
            i++
            this.pushNewData(1)
        }
    }

    clearHypotheses() {
        console.log('clearHypotheses')
        /**
         * remove unnecessary hypotheses
         */
        const keys = Object.keys(this.combs);
        const len = Object.keys(this.combs).length
        for (let i = 0; i < len; i++) {
            const index = len - 1 - i
            if (!this.combs[keys[index]].all) {
                delete this.combs[keys[index]]
            }
        }
    }

    getActiveByTopCriteria(step) {
        // generate hypoteses
        let result = Object.keys(this.combs).reduce((result, key) => {
            const curr = this.combs[key];
            // Check minCount
            if (curr.all > this.config.minCount) {
                for (let i = 1; i <= this.config.stepsAhead; i++) {
                    const bodyUp = {
                        type: 'up',
                        probability: curr.up[i] / curr.all,
                        commulation: curr.commulate_up[i],
                        commulationPerStep: (curr.commulate_up[i] - 1)/(curr.up[i] * i),
                        count: curr.all,
                        i: i,
                        comb: curr,
                    }
                    result.push(bodyUp)
                    if (!this.config.noDown) {
                        const bodyDown = {
                            type: 'down',
                            probability: curr.down[i] / curr.all,
                            commulation: curr.commulate_down[i],
                            commulationPerStep: (curr.commulate_down[i] - 1)/(curr.up[i] * i),
                            count: curr.all,
                            comb: curr,
                            i: i
                        }
                        result.push(bodyDown)
                    }
                }
            }
            return result
            }, [])

            // Use strategy

            result = result.sort((a, b) => b.commulationPerStep - a.commulationPerStep)

            const maxCount = step * this.config.density
            let currCount = 0
            let filteredResult = []
            while (currCount < maxCount) {
                const curr = result.shift()
                currCount += curr.comb.all
                filteredResult.push(curr)
            }

            filteredResult = filteredResult.map(v => this.getActiveBody(v.comb, v.type, v.i))
            
            if (this.config.borders.length) {
                filteredResult = filteredResult.filter(v => !this.config.borders.some(b => !this.borderIsFine(v.commulate_hist, b)))
            }

            return filteredResult
    }

    borderIsFine(hist, cond) {
        const len = hist.length
        if (cond.border <= len) {
            const commulation = hist.slice(len - cond.border).reduce((a, b) => a * b)
            if (commulation < cond.moreThan) {
                return false
            }
        }
        return true
    }

    bordersIsFine(comb, i, type, bord) {
        let result = true
        const field = type == 'up' ? 'commulate_hist_up' : 'commulate_hist_down'
        const hist = comb[field][i]
        try {
            bord.forEach(cond => {
                if (!this.borderIsFine(hist, cond)) {
                    result = false
                    throw 'not okay'
                }
            })
        } catch (err) {
            if (err != 'not okay') {
                throw err
            }
        }

        return result
    }

    getActiveBody(comb, type, i) {
        return {
            type: type,
            probability: type == 'up' ? comb.up[i]/comb.all : comb.down[i]/comb.all,
            commulationPerStep: type == 'up' ? (comb.commulate_up[i] - 1)/(comb.up[i] * i) : (comb.commulate_down[i] - 1)/(comb.down[i] * i),
            all: comb.all,
            allSteps: type == 'up' ? (comb.up[i] * i) : (comb.down[i] * i),
            val: [...comb],
            string: comb.string,
            commulate_hist: type == 'up' ? comb.commulate_hist_up[i] : comb.commulate_hist_down[i],
            stepsAhead: i,
            comb
        }
    }

    getProfit(start, end) {
        return ((this.data[end].close - this.config.comission * 2)/ this.data[start].close)
    }

    isProfitable(start, end) {
        return this.getProfit(start, end) > 1
    }

    processRow(index, isTrain = true) {
        Object.keys(this.combs).forEach(key => {
            const c = this.combs[key]
            if (!this.predicates.some((p, j) => !p.check(c[j], index, this.availableData))) {
                
                if (!c.all) {
                    this.initCombinationFields(c)
                } else {
                    c.all++
                }

                // check results 

                for (let i = 1; i <= this.config.stepsAhead; i++) {
                    if (this.availableData.length > index + i) {
                        if (this.isProfitable(index, index + i)) {
                            c.up[i]++
                        } else {
                            c.down[i]++
                        }

                        const toUp = this.getProfit(index, index + i)
                        const toDown = 1 / toUp

                        //TODO make hold on strategy
                        if (c.up_block[i] <= index) {
                            c.commulate_up[i] = c.commulate_up[i] * toUp
                            c.commulate_hist_up[i].push(toUp)
                            c.up_block[i] = index + i
                        }

                        if (c.down_block[i] <= index) {
                            c.commulate_down[i] = c.commulate_down[i] * toDown
                            c.commulate_hist_down[i].push(toDown)
                            c.up_block[i] = index + i
                        }
                    } else {
                        console.log()
                    }
                }
            }
        })

        // remove unactual active hypoteses
        if (!isTrain) {
            this.active = this.getActiveByTopCriteria(index)
        }
    }

    hypotesPriority(first, second) {
        return first.commulationPerStep > second.commulationPerStep
    }

    checkRow(index) {
        let up = false
        let down = false
        let obj
        let steps
        try {
            this.active.forEach(c => {
                if (!this.predicates.some((p, j) => !p.check(c.val[j], index, this.availableData))) {

                    if (c.type === 'up') {
                        up = true
                    } else {
                        if (this.config.noDown) {
                            return
                        }
                        down = true
                    }

                    if (up && down) {
                        throw new Error('collision')
                    }

                    if (!obj || this.hypotesPriority(c, obj)) {
                        obj = c
                        steps = c.stepsAhead
                    }
                }
            })
        } catch(err) {
            up = false
            down = false
        }

        const operation = {}

        if (up) {
            operation.profit = this.getProfit(index, index + steps)
        } else if (down) {
            operation.profit = 1/this.getProfit(index, index + steps)
        }

        // GET OPERATION BODY

        if (operation.profit) {
            operation.obj = obj
            operation.steps = steps
            operation.from = index
            operation.to = index + steps
            this.profit = this.profit * operation.profit
            this.operations.push(operation)
            this.nextStepFrom = index + steps - 1
        }
    }

    initCombinationFields(c) {
        c.all = 1

        c.up = {}
        c.up_block = {}
        c.commulate_up = {}
        c.commulate_hist_up = {}

        c.down = {}
        c.down_block = {}
        c.commulate_down = {}
        c.commulate_hist_down = {}

        for (let i = 1; i <= this.config.stepsAhead; i++) {
            c.up[i] = 0
            c.up_block[i] = 0
            c.commulate_up[i] = 1
            c.commulate_hist_up[i] = []

            c.down[i] = 0
            c.down_block[i] = 0
            c.commulate_down[i] = 1
            c.commulate_hist_down[i] = []
        }
    }
}

module.exports = Algorithm