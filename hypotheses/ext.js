const Combinatorics = require('js-combinatorics')

module.exports = (data) => {

    function getString() {
        return comb.map((v, i) => {
            if (v == 1) {
                return `isLocalMax(v${i})`
            } else {
                return `isLocalMin(v${i})`
            }
            return undefined
        }).filter(Boolean).join(' & ')
    }

    function getCombs(m) {
        return Combinatorics.baseN([0, -1, 1], m).toArray()
    }

    function getVal(i, short = false) {
        if (i == 0) {
            return data[i].price > data[i + 1].price ? 1 : -1
        }
        if (i > data.length - 2) {
            short = true
        }
        if (short) {
            return data[i].price > data[i - 1].price ? 1 : -1
        } else {
            if ((data[i].price > data[i - 1].price) && (data[i].price > data[i + 1].price)) {
                return 1
            } else if ((data[i].price < data[i - 1].price) && (data[i].price < data[i + 1].price)) {
                return -1
            }
            return 0
        }
    }

    function check(comb, indeces) {
        const mapExt = indeces.map((v, i) => {
            if (i === indeces.length - 1) {
                return getVal(v, true)
            }
            return getVal(v)
        })
        try {
            mapExt.forEach((v, i) => {
                if (v != comb[i]) {
                    throw new Error('not okay')
                }
            })
        } catch (err) {
            return false
        }
        return true
    }

    return {
        getCombs,
        check,
        getString
    }
}
