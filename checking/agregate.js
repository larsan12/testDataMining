const knex = require('knex')({
    client: 'pg',
    connection: {
      host : 'localhost',
      user : 'postgres',
      password : 'postgres',
      database : 'vkr'
    },
  })

const fs = require('fs')

const logF = false;

console.logf = (str) => {
    if (logF) {
        console.log(str)
    }
}

const getDate = (d) => {
    let h = d.getHours()
    let date = new Date(0)
    date.setDate(d.getDate())
    date.setMonth(d.getMonth())
    date.setFullYear(d.getFullYear())
    if (h > 12) {
        date = new Date(date.getTime() + 1000*60*60*24)
    }
    return date.getTime()
}

async function run () {
    try {
        let common = {}
        let oilData = {}
        let currencyData = {}
        let exchangeData = {}

        let [ oil, currency, exchange ] = await Promise.all([
            knex('oil2').whereRaw(`date > ?`, new Date(1393542000000)),
            knex('usd').whereRaw(`date > ?`, new Date(1393542000000)),
            knex('exchange2').whereRaw(`date > ? and company_id = ?`, [ new Date(1393542000000), 32 ])
        ])

        console.logf('')
        console.logf('OIL')
        console.logf('')

        oil.forEach(d => {
            let date = getDate(new Date(d.date))
            let obj = {
                max:d.max,
                min:d.min,
                open:d.open,
                price:d.price,
                volume:d.volume,
                date: d.date
            }
            if (oilData[date]) {
                oilData[date].push(obj)
                console.logf(d.date)
                console.logf(oilData[date][0].date)
                console.logf('---------------------')
            } else {
                oilData[date] = [obj]
            }
        })

        console.logf('')
        console.logf('CURRENCY')
        console.logf('')

        currency.forEach(d => {
            let date = getDate(new Date(d.date))
            let obj = {
                max:d.max,
                min:d.min,
                open:d.open,
                price:d.price,
                date: d.date
            }
            if (currencyData[date]) {
                currencyData[date].push(obj)
                console.logf(d.date)
                console.logf(currencyData[date][0].date)
                console.logf('---------------------')
            } else {
                currencyData[date] = [obj]
            }
        })

        console.logf('')
        console.logf('EXCHANGE')
        console.logf('')

        exchange.forEach(d => {
            let date = getDate(new Date(d.date))
            let obj = {
                max:d.max,
                min:d.min,
                open:d.open,
                price:d.price,
                volume:d.volume,
                date: d.date
            }
            if (exchangeData[date]) {
                exchangeData[date].push(obj)
                console.logf(d.date)
                console.logf(exchangeData[date][0].date)
                console.logf('---------------------')
            } else {
                exchangeData[date] = [obj]
            }

            // aggregate

                common[date] = {
                    exchange: exchangeData[date] ? exchangeData[date][0] : null,
                    oil: oilData[date] ? oilData[date][0] : null,
                    currency: currencyData[date] ? currencyData[date][0] : null
                }
        })

        console.log(Object.keys(common).length)
        let prev;

        fs.writeFileSync('./output.json', JSON.stringify(common))

        Object.keys(common).sort().forEach(k => {
            // checking
            /*
            if (!prev) {
                prev = k
            } else {
                let days = ((k - prev)/(1000*60*60*24))
                if (days > 1) {
                    //console.log("###############")
                    //console.log(days + "   " + (common[k].oil ? common[k].oil.date : ''))
                }
                if (!common[k].oil || !common[k].exchange || !common[k].currency) {
                    console.log(k + `${common[k].oil ? 'oil' : ''}` + '-' + `${common[k].exchange ? 'exchange' : ''}` + '-' + `${common[k].currency ? 'usd' : ''}`)
                }
                prev = k
            }
            */
           if (!common[k].oil || !common[k].exchange || !common[k].currency) {
               delete common[k]
           }
        })

        console.log('success')
    } catch (err) {
        console.log(err)
    }
}

run()

