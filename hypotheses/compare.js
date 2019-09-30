const Combinatorics = require('js-combinatorics')

const Compare = (field, depth) => (data) => {
    function getString(comb) {
        return comb.map(v => `(v${v[0]}.${field} > v${v[1]}.${field})`).join(' & ')
    }

    function getCombs() {
        const vars = (new Array(depth).fill(0)).map((v, i) => i)
        let compareCombs = Combinatorics.permutation(vars).toArray()
        compareCombs = compareCombs.map(comp => {
            const result = []
            for (let i = 1; i < comp.length; i++) {
                result.push([comp[i - 1], comp[i]])
            }
            result.id = this.getId(result)
            return result
        })
        return compareCombs
    }
    // including index
    function check(comb, index) {
        if (index - depth + 1 < 0) {
            return false
        }
        try {
            comb.forEach(v => {
                const leftIndex = index - depth + 1 + v[0]
                const rightIndex = index - depth + 1 + v[1]
                if (data[leftIndex][field] <= data[rightIndex][field]) {
                    throw new Error('not okay')
                }
            })
        } catch (err) {
            return false
        }
        return true
    }

    function defineId(indeces) {

    }

    function getId(comb) {
        return comb.map(row => row.join('')).join('')
    }

    return {
        getCombs,
        check,
        getString,
        getId,
    }
}

module.exports = Compare;

/**
 * Tests
 */
const test = Compare('test')([]);