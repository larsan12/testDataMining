var rp = require('request-promise')
const knex = require('knex')({
    client: 'mysql',
    connection: {
      host : 'mysql.9092075034.myjino.ru',
      user : '046343474_nir',
      password : 'ueuTrb*u8bek',
      database : '9092075034_nir'
    },
  });

/**
 * POST https://tezis.io/api/average_exrate_data
 * {"baseCurrency":"RUB","endTime":1577825999,"granularity":"year","isAverage":true,"startTime":725846400,"targetCurrency":"USD"}
 * 
 * средние показатели
 * average: 58.301353658537
    close: "57.6002"
    open: "59.8961"
    time: "1497916800"

 * Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik1FRTRORVF3TjBVMlF6Y3dNVFk1T1VSR1F6aEdRelEzUWpkRlFVUXhNa00xTTBJek9VRTBSQSJ9.eyJodHRwOi8vdGV6aXMuaW8vY3VzdG9tX2RiX3VzZXJfaWQiOiIxMjY2NyIsImN1c3RvbV9kYl91c2VyX2lkIjoiMTI2NjciLCJpc3MiOiJodHRwczovL2F1dGgudGV6aXMuaW8vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDE4NjMwOTMzNjI2NDE3OTg1NjAiLCJhdWQiOiJqVzV1VWx1NTBJRVhINjdHVVR2NGc2VXZieGtKdzFKUCIsImlhdCI6MTU1MDg2MDg2NiwiZXhwIjoxNTUwODY4MDY2fQ.LHZ9qxSs5YreZHdd0cE4OhQpK61ZjyEON9QX5iCEaIVrIG_Jh1Ouudh9bYqxUXT_jSfqZiSvBfMA9pf9oAU0__V95bA4IpT7hEOjwbHE-pz_cYyGtbL_p51bIihffv7zso5_SR0MR5MqdzW7eL2SBeqfWEp4jsgXHmE2e8RO9sNeA0kCV1SVyjKZPLveyjCBHsIYwdduQX15Y7LSpv4dor3zmkoNGvn-1SknpxJk1Rbg7X9EPOw8RIj2AUiJS1sLLR7_Je-ac_5uRFCEFA7rpgqJwtfru0D3cDSmDyjOcxXHF7gFP1i_A5Dg1Kh6XYvl4v71CMhqTdz-Kk2-uSWujQ
 * 
 * POST https://tezis.io/api/instruments_mdata_history
 * {"endTime":1550861368.456,"granularity":"day","instrumentIds":["535"],"pointsNum":365,"startTime":1519246800}
 * все показатели
 * 
 * POST https://tezis.io/api/news
 * {"companyId":"32","endTime":1550861368.456,"isFuture":false,"isRenewal":null,"significance":"year","startTime":1519246800,"storyTimeField":"happened"}
 * новости
 * 
 * POST https://tezis.io/api/company_fin_param_data_by_type
 * {"earnings":{"datesCount":5,"finParamDescriptors":[{"companyId":"32","currency":"RUB"}],"isCurrentYearIncluded":false,"periodTypes":["ann"],"standard":"ifrs"}}
 * 
 * POST https://tezis.io/api/dividend_data_by_type
 * {"payments_per_share":{"datesCount":5,"dividendDescriptors":[{"companyId":"32","currency":"RUB","instrumentType":"common_stock"}],"groupByDateHappenedYear":false},"next_payment":{"dividendDescriptors":[{"companyId":"32","currency":"RUB","instrumentType":"common_stock"}]}}
 * 
 * POST https://tezis.io/api/company_fin_param_data_by_type
 * {"capitalization":{"datesCount":2,"finParamDescriptors":[{"companyId":"32","currency":"RUB"}],"isCurrentYearIncluded":false,"periodTypes":["ann"],"standard":"ifrs"}}
 * 
 * POST https://tezis.io/api/company_fin_param_data_by_type
 * {"assets":{"datesCount":6,"finParamDescriptors":[{"companyId":"32","currency":"RUB"}],"isCurrentYearIncluded":false,"periodTypes":["ann"],"standard":"ifrs"},"capital":{"datesCount":6,"finParamDescriptors":[{"companyId":"32","currency":"RUB"}],"isCurrentYearIncluded":false,"periodTypes":["ann"],"standard":"ifrs"},"capitalization":{"datesCount":6,"finParamDescriptors":[{"companyId":"32","currency":"RUB"}],"isCurrentYearIncluded":false,"periodTypes":["ann"],"standard":"ifrs"},"earnings":{"datesCount":6,"finParamDescriptors":[{"companyId":"32","currency":"RUB"}],"isCurrentYearIncluded":false,"periodTypes":["ann"],"standard":"ifrs"},"ebitda":{"datesCount":6,"finParamDescriptors":[{"companyId":"32","currency":"RUB"}],"isCurrentYearIncluded":false,"periodTypes":["ann"],"standard":"ifrs"},"revenue":{"datesCount":6,"finParamDescriptors":[{"companyId":"32","currency":"RUB"}],"isCurrentYearIncluded":false,"periodTypes":["ann"],"standard":"ifrs"},"total_cash":{"datesCount":6,"finParamDescriptors":[{"companyId":"32","currency":"RUB"}],"isCurrentYearIncluded":false,"periodTypes":["ann"],"standard":"ifrs"},"total_debt":{"datesCount":6,"finParamDescriptors":[{"companyId":"32","currency":"RUB"}],"isCurrentYearIncluded":false,"periodTypes":["ann"],"standard":"ifrs"},"total_liabilities":{"datesCount":6,"finParamDescriptors":[{"companyId":"32","currency":"RUB"}],"isCurrentYearIncluded":false,"periodTypes":["ann"],"standard":"ifrs"}}
 * 
 */

let companyId = "32"
var optionsExchange = {
    method: 'POST',
    uri: 'https://tezis.io/api/instruments_mdata_history',
    headers: {
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik1FRTRORVF3TjBVMlF6Y3dNVFk1T1VSR1F6aEdRelEzUWpkRlFVUXhNa00xTTBJek9VRTBSQSJ9.eyJodHRwOi8vdGV6aXMuaW8vY3VzdG9tX2RiX3VzZXJfaWQiOiIxMjY2NyIsImN1c3RvbV9kYl91c2VyX2lkIjoiMTI2NjciLCJpc3MiOiJodHRwczovL2F1dGgudGV6aXMuaW8vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDE4NjMwOTMzNjI2NDE3OTg1NjAiLCJhdWQiOiJqVzV1VWx1NTBJRVhINjdHVVR2NGc2VXZieGtKdzFKUCIsImlhdCI6MTU1MzgxMDE0MiwiZXhwIjoxNTUzODE3MzQyfQ.2bUf3oSJLmXOXt7Se6JwIoA-0ub0L22knK2WKs_HjeewI7KrkKUqGGDfv5mtNX1fl8QaoeztxFFf7ttnhNLMRG03hHSc7XwBNUVVYb8XiX9jifK2ZtVFb4Vul-4s_2Y61208pRe1hsZ9nqRzQMkq6wGGdvgXYtd6XMinQbC_xNEXYsiJjlxo14H38oR-4mt0QLA0-j1dbnRX-QQACo4tfT-Mi8C-K2QvPNDXBwfz_VbA6Lnpj6R6mw6HigjvXjNiLGlmfv1Ln85rUaWqAv-5POTTrMVzrYpEzXKyLG0qqel_dnhrbs1Tzg6vV2iOtyMjOe7kLl6-7xdd3MrPeA4DpA'
    },
    body: {
        "endTime":1551384436.043,
        "granularity":"day",
        "instrumentIds":["535"],
        "pointsNum":400,
        "startTime":1393531200
    },
    json: true // Automatically parses the JSON string in the response
}

var optionEvents = {
    method: 'POST',
    uri: 'https://tezis.io/api/news',
    headers: {
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik1FRTRORVF3TjBVMlF6Y3dNVFk1T1VSR1F6aEdRelEzUWpkRlFVUXhNa00xTTBJek9VRTBSQSJ9.eyJodHRwOi8vdGV6aXMuaW8vY3VzdG9tX2RiX3VzZXJfaWQiOiIxMjY2NyIsImN1c3RvbV9kYl91c2VyX2lkIjoiMTI2NjciLCJpc3MiOiJodHRwczovL2F1dGgudGV6aXMuaW8vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDE4NjMwOTMzNjI2NDE3OTg1NjAiLCJhdWQiOiJqVzV1VWx1NTBJRVhINjdHVVR2NGc2VXZieGtKdzFKUCIsImlhdCI6MTU1MzgxMDE0MiwiZXhwIjoxNTUzODE3MzQyfQ.2bUf3oSJLmXOXt7Se6JwIoA-0ub0L22knK2WKs_HjeewI7KrkKUqGGDfv5mtNX1fl8QaoeztxFFf7ttnhNLMRG03hHSc7XwBNUVVYb8XiX9jifK2ZtVFb4Vul-4s_2Y61208pRe1hsZ9nqRzQMkq6wGGdvgXYtd6XMinQbC_xNEXYsiJjlxo14H38oR-4mt0QLA0-j1dbnRX-QQACo4tfT-Mi8C-K2QvPNDXBwfz_VbA6Lnpj6R6mw6HigjvXjNiLGlmfv1Ln85rUaWqAv-5POTTrMVzrYpEzXKyLG0qqel_dnhrbs1Tzg6vV2iOtyMjOe7kLl6-7xdd3MrPeA4DpA'
    },
    body: {
        companyId,
        "endTime":1551384436.043,
        "isFuture":false,
        "isRenewal":null,
        "significance":"all_time",
        "startTime":1393531200,
        "storyTimeField":"happened"
    },
    json: true // Automatically parses the JSON string in the response
}

const insert = (table, data) => knex.table(table).insert(data)
    .catch(err => {
        if (err.sqlMessage.indexOf('Duplicate entry') === -1) {
            throw err
        }
    })

const run = async () => {
    try {
        await insert('companies', {id: companyId, name: 'Газпром нефть'})
        let topicsNames
        let topics = []
        let [ prices, events ] = await Promise.all([rp(optionsExchange), rp(optionEvents)]);
        prices = prices.data[0][1].map(v => {
            const { close, time, open } = v
            return { close, date: new Date(parseInt(time) * 1000), open, company_id: companyId }
        }).filter(p => p.date && p.date > 0)

        topicsNames = events.topics // id, name
        let now = Date.now()
        events = events.stories.map(s => {
            const { id, isTopStory, timeHappened, timePosted } = s
            const { sourceLink, title, type } = s.storyData
            topics = [
                ...topics,
                ...Object.keys(s.storyData.topics)
                    .map(k => Object.assign({}, {topic_id: k, story_id: id, value: s.storyData.topics[k]}))
            ]
            return { 
                id, 
                isTopStory, 
                timeHappened: new Date(parseInt(timeHappened) * 1000), 
                timePosted: new Date(parseInt(timePosted) * 1000), 
                sourceLink, 
                title, 
                type 
            }
        })


        /* stories: 
            id
            isTopStory
            sourceLink
            timeHappened
            timePosted
            title
            type
        */

        await insert('stories', events)

        /* storiestopics:
            id - incr
            story_id
            topic_id
            value
        */

        //await insert('storiestopics', topics)

        /* topic:
            id,
            name
        */

        //await insert('topic', topicsNames)

        /* exchange:
            close - incr
            company_id
            date
            id
            open
        */

        //await insert('exchange', prices)


        console.log('SUCCESS')

    } catch (err) {
        console.log("!!!!!!!!!!!!!!!!!!!!!!!")
        console.log(err)
    }
}

run()