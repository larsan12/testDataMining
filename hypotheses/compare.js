const Combinatorics = require('js-combinatorics')

const Compare = (field, depth) => {
    function getString(comb) {
        return comb.map(v => `(v${v[0]}.${field} > v${v[1]}.${field})`).join(' & ')
    }

    function defineIds(index, data) {
        if (index - depth + 1 < 0) {
            return false
        }
        const row = data.slice(index - depth + 1, index + 1)
        // check break
        // break ставится, если с предыдущими данными есть разрыв
        if (row.slice(1).some(val => val.break)) {
            return false
        }

        let id = row.map((val, i) => ({
            temp_id: i,
            val: parseFloat(val[field])
        }))
        .sort((a, b) => a.val - b.val)
        
        let ids = [id]

        id.forEach((obj, i) => {
            if (id[i + 1] && obj.val === id[i + 1].val) {
                let t = row
                const newId = [...id]
                const temp = newId[i + 1]
                newId[i + 1] = newId[i]
                newId[i] = temp
                ids.push(newId)
            }
        })
        
        ids = ids.map(obj => obj.reduce((res, curr) => res + curr.temp_id, ''))

        return ids
    }

    return {
        getString,
        defineIds,
    }
}

module.exports = Compare;