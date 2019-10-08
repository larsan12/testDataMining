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
        let oil = await fetch("https://news.yandex.ru/quotes/graph_1006.json", {"credentials":"omit","headers":{"accept":"application/json, text/javascript, */*; q=0.01","x-requested-with":"XMLHttpRequest"},"referrer":"https://news.yandex.ru/","referrerPolicy":"origin","body":null,"method":"GET","mode":"cors"});
        oil = await oil.json()
        
        const result = oil.prices.map(val => {
            return {
                brand: 'brent',
                value: val[1],
                date: new Date(parseInt(val[0]))
            }
        })

        await insert('oil', result)

        console.log('SUCCESS')

    } catch (err) {
        console.log("!!!!!!!!!!!!!!!!!!!!!!!")
        console.log(err)
    }
}

run()