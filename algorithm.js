const Combinatorics = require('js-combinatorics')


// TODO count commulation for operations

class Algorithm {
    
    constructor(config, first, second, data) {
        this.first = first(data)
        this.second = second(data)
        this.config = config
        this.data = data
        this.m = config.m
        this.stepsAhead = config.stepsAhead
        this.comb_limit = config.comb_limit || 50
    }

    processing() {
        console.log('Start processing')

        this.combs = Combinatorics.cartesianProduct(this.first.getCombs(this.m), this.second.getCombs(this.m))
            .toArray()
            .map((v, i) => {
                v.string = this.first.getString(v[0]) + ' & ' + this.second.getString(v[1])
                v.index = i
                return v
            })
    
        this.train()
    
        this.checkHypotheses()

        this.removeUnnecessaryDependencies()
    
        return {
            profit: this.profit,
            operations: this.operations,
            config: this.config,
            combs: this.combs.sort((a, b) => b.all - a.all).slice(0, this.comb_limit)
                .map(v => {
                    return {
                        val: [...v],
                        all: v.all,
                        commulate_down: v.commulate_down,
                        commulate_hist_down: v.commulate_hist_down,
                        commulate_hist_up: v.commulate_hist_up,
                        commulate_up: v.commulate_up,
                        down: v.down,
                        string: v.string,
                        up: v.up,
                        index: v.index,
                    }
                })
        }
    }

    removeUnnecessaryDependencies() {
        this.operations.forEach(v => {
            delete v.obj.comb
        })
    }

    train() {
        console.log('Start training')
        const generator = this.getGenerator(parseInt(this.data.length * this.config.trainVolume))
        let indeces
        while (indeces = generator.next()) {
            this.processRow(indeces)
        }

        this.clearHypotheses()
        
        // set active
        this.active = this.getActiveByTopCriteria(this.data.length * this.config.trainVolume)
        console.log('active count: ' + this.active.length)
    }

    clearHypotheses() {
        console.log('clearHypotheses')
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

    getActiveByTopCriteria(step) {
        // generate hypoteses
        let result = this.combs.reduce((result, curr, i) => {
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

    _remove(arr, i) {
        arr.splice(i, 1)
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
            id: comb.index + '_' + i + '_' + type,
            index: comb.index,
            comb
        }
    }

    getProfit(start, end) {
        return ((this.data[end].close - this.config.comission * 2)/ this.data[start].close)
    }

    isProfitable(start, end) {
        return this.getProfit(start, end) > 1
    }

    processRow(indeces, isTrain = true) {
        const lastIndex = indeces[indeces.length - 1]
    
        this.combs.forEach(c => {
            if (this.first.check(c[0], indeces) && this.second.check(c[1], indeces)) {
                
                if (!c.all) {
                    this.initCombinationFields(c)
                } else {
                    c.all++
                }

                // check results 

                for (let i = 1; i <= this.config.stepsAhead; i++) {
                    if (this.data.length > lastIndex + i) {
                        if (this.isProfitable(lastIndex, lastIndex + i)) {
                            c.up[i]++
                        } else {
                            c.down[i]++
                        }

                        const toUp = this.getProfit(lastIndex, lastIndex + i)
                        const toDown = 1 / toUp

                        //TODO make hold on strategy
                        if (c.up_block[i] <= lastIndex) {
                            c.commulate_up[i] = c.commulate_up[i] * toUp
                            c.commulate_hist_up[i].push(toUp)
                            c.up_block[i] = lastIndex + i
                        }

                        if (c.down_block[i] <= lastIndex) {
                            c.commulate_down[i] = c.commulate_down[i] * toDown
                            c.commulate_hist_down[i].push(toDown)
                            c.up_block[i] = lastIndex + i
                        }
                    }
                }
            }
        })

        // remove unactual active hypoteses
        if (!isTrain) {
            this.active = this.getActiveByTopCriteria(lastIndex)
        }
    }

    hypotesPriority(first, second) {
        return first.commulationPerStep > second.commulationPerStep
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
                if (this.first.check(c.val[0], indeces) && this.second.check(c.val[1], indeces)) {

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

        if (lastIndex + steps >= this.data.length) {
            steps = this.data.length - lastIndex - 1
        }

        if (up) {
            operation.profit = this.getProfit(lastIndex, lastIndex + steps)
        } else if (down) {
            operation.profit = 1/this.getProfit(lastIndex, lastIndex + steps)
        }

        // GET OPERATION BODY

        if (operation.profit) {
            operation.obj = obj
            operation.id = obj.id
            operation.steps = steps
            operation.from = lastIndex
            operation.to = lastIndex + steps
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
        let processIndeces = []
        let ind = 0
        while (indeces = generator.next()) {
            if (!this.nextStepFrom || this.nextStepFrom <= indeces[0]) {
                this.checkRow(indeces)
            }
            if (ind == this.stepsAhead) {
                this.processRow(indeces.map(v => v - this.stepsAhead), false)
            } else {
                ind++
            }
        }
    }

    getGenerator(limit, from = 0) {
        if (!limit) {
            limit = this.data.length
        }
        let i = from - 1
        function next() {
            i = i + 1

            //logging
            if (i % 100 === 0) {
                console.log(`progress: ${i}/${this.data.length}`)
            }

            if ((i + this.m < limit) && (i + this.m < this.data.length)) {
                if (this.data[i + this.m].break) {
                    i = i + this.m
                    if (!((i + this.m < limit) && (i + this.m < this.data.length))) {
                        return false
                    }
                }
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