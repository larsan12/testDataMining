const fs = require('fs')
const Algorithm = require('./algorithm')
const Compare = require('./hypotheses/compare')
const View = require('./statistics')


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
    comission: 0.00034
}

getData().then(data => {

    const alg = new Algorithm(
        config, 
        data, 
        new Compare('open', 3),
        new Compare('close', 3),
    )

    const date = Date.now()
    const result = alg.processing()
    result.processingTime = Date.now() - date
    result.dataLength = data.length
    View.draw('test', result, data)
}).catch(err => {
    console.trace(err)
})