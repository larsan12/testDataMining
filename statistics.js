const fs = require('fs')

class Statistic {
    constructor () {
    }

    static draw(data, name) {
        Statistic.setFiles(data, name)
    }

    static setFiles(data, name) {
        let name1 = name
        let i = 0
        while (fs.existsSync('./view/' + name1)) {
            name1 = name + i++
        }
        fs.mkdirSync('./view/' + name1)
        fs.mkdirSync('./view/' + name1 + '/data')
        fs.writeFileSync('./view/' + name1 + '/data/' + 'data.json', JSON.stringify(data))
        fs.copyFileSync('./view/example/index.html', './view/' + name1 +'/index.html')
        fs.copyFileSync('./view/example/script.js', './view/' + name1 +'/script.js')

        console.log('http://localhost:8111/' + name1 + '/index.html')
    }
}

module.exports = Statistic