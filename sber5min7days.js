const fetch = require('node-fetch')

const fs = require('fs')
const Algorithm = require('./algorithm')
const { Ext, Compare } = require('./hypotheses')
const View = require('./statistics')
/*
async function getData() {

    /**
     * 1.50 - from 1540245487 to 1555451222
     */

    //let sber = await fetch("https://api.bcs.ru/udfdatafeed/v1/history?symbol=SBER&resolution=5&from=1544245487&to=1555451222", {"credentials":"omit","headers":{"accept":"*/*","content-type":"text/plain"},"referrer":"https://bcs-express.ru/kotirovki-i-grafiki/sber","referrerPolicy":"no-referrer-when-downgrade","body":null,"method":"GET","mode":"cors"});
    //sber = await sber.json()
    /**
     * o - открытие
     * l - минимум
     * h - максим
     * с - закрытие
     * 
     * t - time
     * v - volume
     *
    
    let result = sber.c.map((v, i) => {
        return {
            open: sber.o[i],
            min: sber.l[i],
            max: sber.h[i],
            close: v,
            price: v,
            time: sber.t[i],
            volume: sber.v[i]
        }
    }).sort((a, b) => a.time - b.time)

    let diff
    let prev

    result.forEach((v, i) => {
        if (!diff) {
            if (prev) {
                diff = v.time - prev
            }
        } else {
            let diff1 = v.time - prev
            if (diff != diff1) {
                result[i].break = true
            }
        }

        prev = v.time
    })

    fs.writeFileSync('./data/sberTrainVol1.json', JSON.stringify(result))
    return result
}
*/
async function getData() {
    const res = JSON.parse(fs.readFileSync('./data/sberTrainVol1.json').toString())
    return res
}

const config = {
    noDown: true,
    density: 0.3,
    minCount: 10,
    borders: [
        {
            border: 5,
            moreThan: 1
        },
        {
            border: 20,
            moreThan: 1
        }
    ],
    trainVolume: 0.2,
    stepsAhead: 3,
    comission: 0.00034,
    m: 3
}

getData().then(data => {
    const alg = new Algorithm(config, data, Compare('open'), Compare('close'))

    const date = Date.now()

    const result = alg.processing()

    result.processingTime = Date.now() - date
    result.dataLength = data.length

    View.draw('test', result, data)

    console.log()
}).catch(err => {
    console.trace(err)
})