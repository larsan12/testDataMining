const fs = require('fs')
const knex = require('knex')({
    client: 'pg',
    connection: {
      host : 'localhost',
      user : 'postgres',
      password : 'postgres',
      database : 'vkr'
    },
  })

const insert = (table, data) => knex.table(table).insert(data)
    .catch(err => {
        if (err.sqlMessage.indexOf('Duplicate entry') === -1) {
            throw err
        }
    })

const parseData = (str) => {
    str = str.split(".")
    let date = new Date(0)
    date.setDate(str[0])
    date.setMonth(str[1])
    date.setFullYear(str[2])
    return date
}
const getVolume = (str) => {
    let result
    const isK = str.indexOf('K') > -1
    if (str.indexOf('K') > -1 || str.indexOf('M') > -1) {
        str = str.substring(0, str.length - 1)
        result = parseFloat(str.replace(',', '.'))
        result = isK ? result * 1000 : result * 1000000
    } else if (str == '-') {
        result = 0
    } else {
        throw new Error(str)
    }
    return result
}


const run = async () => {
    try {
        let data = fs.readFileSync('./csv_parser/usd.csv').toString()
        data = data.split('\r\n').map(v => v.slice(1, v.length - 2).split('","')).slice(1)
            .map(v => {
                return {
                    open: parseFloat(v[2].replace(',', '.')),
                    price: parseFloat(v[1].replace(',', '.')),
                    max: parseFloat(v[3].replace(',', '.')),
                    min: parseFloat(v[4].replace(',', '.')),
                    change: parseFloat(v[5].replace(',', '.')),
                    date: parseData(v[0])
                }
            })

        await insert('usd', data)

        console.log('SUCCESS')

    } catch (err) {
        console.log("!!!!!!!!!!!!!!!!!!!!!!!")
        console.log(err)
    }
}

run()