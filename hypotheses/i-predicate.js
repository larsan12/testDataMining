class IPredicate {
    constructor(field, depth) {
        this.field = field;
        this.depth = depth;
    }

    getIds(index, data) {
        const {depth} = this;
        if (index - depth + 1 < 0) {
            return false;
        }
        if (index >= data.length) {
            throw new Error('index out of available data');
        }
        const row = data.slice(index - depth + 1, index + 1);
        // check break
        // break ставится, если с предыдущими данными есть разрыв
        if (row.slice(1).some(val => val.break)) {
            return false;
        }
        return this.defineIds(row);
    }

    defineIds() {
        throw new Error('should be override');
    }

}

module.exports = IPredicate;
