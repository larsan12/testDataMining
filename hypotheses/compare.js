const Combinatorics = require('js-combinatorics')

module.exports = (field) => (data) => {
    function getString(comb) {
        return comb.map(v => `(v${v[0]}.${field} > v${v[1]}.${field})`).join(' & ')
    }

    function getCombs(m) {
        const vars = (new Array(m).fill(0)).map((v, i) => i)
        let compareCombs = Combinatorics.permutation(vars).toArray()
        compareCombs = compareCombs.map(comp => {
            const result = []
            for (let i = 1; i < comp.length; i++) {
                result.push([comp[i - 1], comp[i]])
            }
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

    return {
        getCombs,
        check,
        getString
    }
}