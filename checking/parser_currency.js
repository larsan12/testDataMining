const fetch = require('node-fetch')
const zlib = require("zlib")
const knex = require('knex')({
    client: 'mysql',
    connection: {
      host : 'mysql.9092075034.myjino.ru',
      user : '046343474_nir',
      password : 'ueuTrb*u8bek',
      database : '9092075034_nir'
    },
  })


const insert = (table, data) => knex.table(table).insert(data)
    .catch(err => {
        if (err.sqlMessage.indexOf('Duplicate entry') === -1) {
            throw err
        }
    })

const currencies = {
    '840': 'usd',
    '978': 'eur'
}

const run = async () => {
    try {
        let currency = await fetch("https://www.banki.ru/products/currency/ajax/quotations/history/cbr/", {"credentials":"include","headers":{"accept":"application/json, text/javascript, */*; q=0.01","accept-language":"ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7","content-type":"application/json","x-requested-with":"XMLHttpRequest"},"referrer":"https://www.banki.ru/products/currency/cny/","referrerPolicy":"no-referrer-when-downgrade","body":"{\"currency_id\":156,\"from\":788918400}","method":"POST","mode":"cors"});

        currency = await currency.json()
        
        const result = Object.keys(currency.history).map(key => {
            return {
                currency: 'cny',
                value: currency.history[key],
                date: new Date(parseInt(key) * 1000)
            }
        })

        await insert('currency', result)

        console.log('SUCCESS')

    } catch (err) {
        console.log("!!!!!!!!!!!!!!!!!!!!!!!")
        console.log(err)
    }
}

run()