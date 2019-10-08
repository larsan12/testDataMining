const fs = require('fs')
const knex = require('knex')({
    client: 'mysql',
    connection: {
      host : 'mysql.9092075034.myjino.ru',
      user : '046343474_nir',
      password : 'ueuTrb*u8bek',
      database : '9092075034_nir'
    },
  })
const CompanyId = 32

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
    } else {
        throw new Error(str)
    }
    return result
}


const run = async () => {
    try {
        let exchange = fs.readFileSync('./Прошлые данные - SIBN.csv').toString()
        exchange = exchange.split('\r\n').map(v => v.slice(1, v.length - 2).split('","')).slice(1)
            .map(v => {
                return {
                    company_id: CompanyId,
                    open: v[2],
                    price: v[1],
                    max: v[3],
                    min: v[4],
                    volume: getVolume(v[5]),
                    change: parseFloat(v[6].replace(',', '.')),
                    date: parseData(v[0])
                }
            })

        await insert('exchange2', exchange)

        console.log('SUCCESS')

    } catch (err) {
        console.log("!!!!!!!!!!!!!!!!!!!!!!!")
        console.log(err)
    }
}

run()