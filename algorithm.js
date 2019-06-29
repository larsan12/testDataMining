const Combinatorics = require('js-combinatorics')


// TODO count commulation for operations
// train on getActiveByTopCriteria

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
        this.setActiveHypoteses()
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

    getActiveByTopCriteria() {
        let result = this.combs.reduce((result, curr, i) => {
            // Check minCount
                if (curr.all > this.config.topCriteria.minCount) {
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
                        if (curr.index == 3 && i == 3) {
                            console.log()
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

            // Set countBorder
            if (result.length > this.config.topCriteria.countBorder) {
                result = result.sort((a, b) => b.count - a.count).slice(0, this.config.topCriteria.countBorder)
            }

            // Use strategy

            result = result.sort((a, b) => {
                let result;
                if (this.config.topCriteria.strategy == 'commulationPerStep') {
                    result =  b.commulationPerStep - a.commulationPerStep
                } else if (this.config.topCriteria.strategy == 'commulation') {
                    result = b.commulation - a.commulation
                }
                return result
            })
            result = result.slice(0, this.config.topCriteria.top)
                .map(v => this.getActiveBody(v.comb, v.type, v.i))
            
            if (this.config.topCriteria.borders.length) {
                result = result.filter(v => !this.config.topCriteria.borders.some(b => !this.borderIsFine(v.commulate_hist, b)))
            }
                
            return result
    }

    setActiveHypoteses() {
        this.active = []
        if (this.config.topCriteria) {
            this.active = this.getActiveByTopCriteria()
        } else {
            this.combs.forEach(r => {
                const active = this.getActiveHypoteses(r)
                if (active.length) {
                    this.active = this.active.concat(active)
                } 
            })
        }
        console.log('active count: ' + this.active.length)
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

    checkRequirementsUp(comb, i) {
        return (
            (comb.up[i] / comb.all > this.config.minProbality)
            &&
            this.bordersIsFine(comb, i, 'up', this.config.commulateBorders)
        )
    }

    checkRequirementsDown(comb, i) {
        return (
            (comb.down[i] / comb.all > this.config.minProbality)
            &&
            this.bordersIsFine(comb, i, 'down', this.config.commulateBorders)
        )
    }

    getActiveHypoteses(comb) {
        let active = []
        if (comb.all && comb.all > this.config.minCount) {
            for (let i = 1; i <= this.config.stepsAhead; i++) {
                if (this.checkRequirementsUp(comb, i)) {
                    active.push(this.getActiveBody(comb, 'up', i))
                }
                if (this.checkRequirementsDown(comb, i)) {
                    active.push(this.getActiveBody(comb, 'down', i))
                }
            }
        }

        return active
    }


    checkHypotezAgain(comb) {
        let active = this.getActiveHypoteses(comb)
        if (active.length) {
            this.active = this.active.filter(e => e.index != comb.index).concat(active)
        }
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
                        if (c.index == 0 && i == 3) {
                            console.log()
                        }
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

                if (!isTrain && !this.config.topCriteria) {
                    this.checkHypotezAgain(c)
                }
            }
        })

        // remove unactual active hypoteses
        if (!isTrain) {
            if (!this.config.topCriteria) {
                this.active.forEach((a, l) => {
                    if (a.type == 'up') {
                        if (!this.checkRequirementsUp(a.comb, a.stepsAhead)) {
                            return this._remove(this.active, l)
                        }
                    } else {
                        if (!this.checkRequirementsDown(a.comb, a.stepsAhead)) {
                            return this._remove(this.active, l)
                        }
                    }
                    a.probability = a.type == 'up' ? a.comb.up[a.stepsAhead]/a.comb.all : a.comb.down[a.stepsAhead]/a.comb.all
                    a.all = a.comb.all
                })
            } else {
                this.active = this.getActiveByTopCriteria()
            }
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