const Combinatorics = require('js-combinatorics')

module.exports = (data) => {
    function getCombs(m) {
        return Combinatorics.baseN([0, -1, 1], m).toArray()
    }

    function getVal(i, short = false) {
        if (i < 1 || i > data.length - 2) {
            short = true
        }
        if (short) {
            return data[i] > data[i - 1] ? 1 : -1
        } else {
            if ((data[i] > data[i - 1]) && (data[i] > data[i + 1])) {
                return 1
            } else if ((data[i] < data[i - 1]) && (data[i] < data[i + 1])) {
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
        check
    }
}
