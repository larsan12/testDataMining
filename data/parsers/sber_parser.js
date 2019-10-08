const fetch = require('node-fetch')

// https://bcs-express.ru/kotirovki-i-grafiki/sber

const run = async () => {
    try {
        let from = 1555276106
        let to = 1555448966
        let sber = await fetch("https://api.bcs.ru/udfdatafeed/v1/history?symbol=SBER&resolution=5&from=1554245487&to=1555451222", {"credentials":"omit","headers":{"accept":"*/*","content-type":"text/plain"},"referrer":"https://bcs-express.ru/kotirovki-i-grafiki/sber","referrerPolicy":"no-referrer-when-downgrade","body":null,"method":"GET","mode":"cors"});
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
                time: sber.t[i],
                volume: sber.v[i]
            }
        })

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
                    console.log(diff1)
                    result[i].break = true
                }
            }

            prev = v.time
        })
        
        console.log('SUCCESS')

    } catch (err) {
        console.log("!!!!!!!!!!!!!!!!!!!!!!!")
        console.log(err)
    }
}

run()