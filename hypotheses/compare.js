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

    function check(comb, indeces) {
        try {
            comb.forEach(v => {
                if (data[indeces[v[0]]][field] <= data[indeces[v[1]]][field]) {
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