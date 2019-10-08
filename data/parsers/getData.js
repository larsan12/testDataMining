const fetch = require('node-fetch')

const fs = require('fs')
const Algorithm = require('./algorithm')
const { Ext, Compare } = require('./hypotheses')

async function getData(from, to) {

    /**
     * 1.50 - from 1540245487 to 1555451222
     */

    let sber = await fetch(`https://api.bcs.ru/udfdatafeed/v1/history?symbol=SBER&resolution=5&from=${from}&to=${to}`, 
        {"credentials":"omit","headers":{"accept":"*/*","content-type":"text/plain"},
        "referrer":"https://bcs-express.ru/kotirovki-i-grafiki/sber",
        "referrerPolicy":"no-referrer-when-downgrade","body":null,
        "method":"GET","mode":"cors"});
        
    sber = await sber.json()
    /**
     * o - открытие
     * l - минимум
     * h - максим
     * с - закрытие
     * 
     * t - time
     * v - volume
     */

    let result = sber.c.map((v, i) => {
        return {
            open: sber.o[i],
            min: sber.l[i],
            max: sber.h[i],
            close: v,
            price: (sber.h[i] + sber.l[i])/2,
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
