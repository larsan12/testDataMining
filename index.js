const fs = require('fs')
const Algorithm = require('./algorithm')
const { Ext, Compare } = require('./hypotheses')


function getData() {

    const data = JSON.parse(fs.readFileSync('./data/output.json'))
    const day = 1000 * 60 * 60 * 24

    /**
     * 
     * TODO:
     * - данные, учесть пропасти между ними в алгоритме
     */

    function parseData(data) {
        let newData =[]
        let lastDate
        let lastDay
        Object.keys(data).sort().forEach(k => {
            if (!lastDate) {
                lastDate = k
                newData.push({
                    ...data[k],
                    day: 0
                })
                lastDay = 0
            } else {
                let days = (k - lastDate)/day
                lastDate = k
                lastDay = days + lastDay
                newData.push({
                    ...data[k],
                    day: parseInt(lastDay)
                })
            }
        })

        return newData
    }

    const newData = parseData(data)

    const prices = newData.map(obj => {
        /*return {
            day: obj.day,
            price: obj.exchange.price
        }*/
        return {
            price: obj.exchange.price
        }
    })

    return prices
}


const config = {
    compareLimit: 6,
    minCount: 20,
    minProbality: 0.65,
    commulateBorder: 0.005,
    trainVolume: 0.75,
    stepsAhead: 5,
    m: 3,
    commulateBorders: [
        {
            border: 4,
            moreThan: 1
        },
        {
            border: 20,
            moreThan: 1.01
        }
    ]
}


const alg = new Algorithm(config, Ext, Compare('price'), getData())

const result = alg.processing()

fs.writeFileSync('./data/result3.json', JSON.stringify(result))

console.log()