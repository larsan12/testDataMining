const IPredicate = require('./i-predicate');

class Compare extends IPredicate {
    getString(id) {
        const {field} = this;
        const result = [];
        for (let i = 1; i < id.length - 1; i++) {
            result.push(`(v${id[i-1]}.${field} <= v${id[i]}.${field}) & (v${id[i]}.${field} <= v${id[i+1]}.${field})`)
        }
        return result.join(' & ')
    }

    defineIds(row) {
        const {field} = this;
        let id = row.map((val, i) => ({
            temp_id: i,
            val: parseFloat(val[field])
        }))
        .sort((a, b) => a.val - b.val)

        if (id.length > (new Set(id.map(v => v.val))).size) {
            return []
        }
        id = id.reduce((res, curr) => res + curr.temp_id, '')
        return [id]
    }
}

module.exports = Compare;