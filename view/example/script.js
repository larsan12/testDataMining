const noDown = true;
var data;
var inputData;
var minStep;
var maxStep;
var hypoteses;
var hypotes_id = '8_2_down';
var all_hypoteses;
var all_hypoteses_id = '8_2_down'

var profit;
var density;
var commulationDown;
var commulationUp;
var middlePrediction;
var processingTime;


function drawBasic() {
    $.getJSON('./data/data.json', (d) => {

      am4core.useTheme(am4themes_animated);
      // Themes end

      // DATA INIT

      minStep = d.operations[0].from - 30;
      maxStep = d.operations[d.operations.length - 1].from + 30;
      data = d
      inputData = data.data;

      all_hypoteses = d.combs.reduce((result, curr, i) => {
        for (let i = 1; i <= d.config.stepsAhead; i++) {
          const bodyUp = {
            type: 'up',
            count: curr.up[i],
            probability: curr.up[i] / curr.all,
            commulation: curr.commulate_up[i],
            commulate_hist: curr.commulate_hist_up[i],
            stepsAhead: i,
            comb: curr,
            id: curr.id + '_' + i + '_' + 'up'
          }
          result.push(bodyUp)
          
          if (!noDown) {
            const bodyDown = {
              type: 'down',
              count: curr.down[i],
              probability: curr.down[i] / curr.all,
              commulation: curr.commulate_down[i],
              stepsAhead: i,
              commulate_hist: curr.commulate_hist_down[i],
              comb: curr,
              id: curr.id + '_' + i + '_' + 'down'
            }
            result.push(bodyDown)
          }
        }
        return result
      }, [])

      hypoteses = d.operations.reduce((result, curr, i) => {
        if (result[curr.id]) {
          result[curr.id].count+=1;
          result[curr.id].commulation = result[curr.id].commulation * curr.profit;
          result[curr.id].operations.push(curr);
        } else {
          result[curr.id] = {
            obj: curr.obj,
            count: 1,
            commulation: curr.profit,
            id: curr.id,
            operations: [curr]
          }
        }
        return result
      }, {})

      hypoteses = Object.keys(hypoteses).map(k => {
        return {
          ...hypoteses[k]
        }
      })

      //INIT MAIN STATISTIC

      profit = data.profit

      let info = data.operations.reduce((result, curr, i) => {
        if (curr.profit > 1) {
          result.commulationUp = result.commulationUp * curr.profit
          result.success+= 1
          result.successSteps +=curr.steps
        } else {
          result.commulationDown = result.commulationDown * curr.profit
        }
        result.steps += curr.steps
        return result
      }, { steps: 0, commulationDown: 1, commulationUp: 1, success: 0, successSteps: 0})

      density = info.steps + '/' + data.dataLength
      totalCommulationDown = info.commulationDown
      totalCommulationUp = info.commulationUp
      middleStepsLength = info.steps/data.operations.length
      processingTime = data.processingTime
      operationEfficiency = info.success + '/' + data.operations.length
      stepsEfficiency = info.successSteps + '/' + info.steps
      
      setTitle('Конфигурация')
      setInfo({
        ...Object.keys(data.config).reduce((res, curr) => {
          res[curr] = data.config[curr].length ? 
            JSON.stringify(data.config[curr]) : data.config[curr]
          return res
        }, {})
      })

      setTitle('Основная статистика')
      setInfo({
        profit: data.profit.toString().substring(0, 5),
        density,
        totalCommulationDown: totalCommulationDown.toString().substring(0, 5),
        totalCommulationUp: totalCommulationUp.toString().substring(0, 5),
        middleStepsLength: middleStepsLength.toString().substring(0, 4),
        operationEfficiency,
        stepsEfficiency,
        processingTime: processingTime + 'ms'
      })

      // DRAW

      setTitle('Input Data')
      setTable('main_profit', drawInputDataMainColumnChart, 'Курс актива на обучающей выборке');

      setTitle('Графики для выполненных торговых операций')
      setTable('prof_com', drawProfit, 'Общий график прибыльности')
      setTable('hypotez_count', drawHypotesColumnChart, 'Прибыльность гипотез и колличество их использований')
      setTable('prof_oper', drawProfitOper, 'Прибыльность по операциям')
      setTable('steps_com', drawProfitSteps, 'Прибыльность в зависимости от длительности операций')
      setTable('hypotez', drawHypotesCommulation, 'Прибыльность и вероятность для выбранной гипотезы')

      setTitle('Графики для всех найденных гипотез')
      setTable('all_hypotez_count', drawAllHypotesColumnChart, 'Toп 30 гипотез по количеству совпадений')
      setTable('all_hypotez_commul', drawAllHypotesColumnChartCommul, 'Топ 30 гипотез по прибыльности')
      setTable('hypotez_for_all', drawAllHypotesCommulation, 'Прибыльность и вероятность выбранной гипотезы')

    })
}

function setTitle(title) {
  $(`div.all`).first().append(
    `<div class="title">
        <label>${title}</label>
    </div>` 
  );
}

function setInfo(obj) {
  let str = ''
  Object.keys(obj).forEach(k => {
    if (obj[k] != {}.toString()) {
      str += `<label>${k}:${obj[k]}</label>`
    }
  })
  $(`div.all`).first().append(
    `<div class="statistic">
        ${str}
    </div>` 
  );
}


function setTable(cl, func, title) {
  const f = () => {
    $(`div.${cl}`).first().append( `<div id="${cl}" class="graph"></div>` );
    func(cl)
  }
  $(`div.all`).first().append(
    `<div class="${cl} rows">
      <div class="buttom-row">
        <label>${title}</label>
        <button class="buttom">draw</button>
      </div>
    </div>` 
  );
  setDrawFunc(cl, f)
}

function setDrawFunc(cl, f) {
  $(`div.${cl} .buttom-row button`).first()
    .attr("onclick", "")
    .unbind("click")
    .text('draw')
    .click(function() {
      $(this).attr("disabled", true);
      f()
      setHideFunc(cl, f)
      $(this).attr("disabled", false);
    });
}

function setHideFunc(cl, f) {
  $(`div.${cl} .buttom-row button`).first()
    .attr("onclick", "")
    .unbind("click")
    .text('hide')
    .click(function() {
      $(this).attr("disabled", true);
      $(`#${cl}`).remove()
      setDrawFunc(cl, f)
      $(this).attr("disabled", false);
    });
}

function drawInputDataMainColumnChart(cl) {
  const options = {
    xVal: 'step',
    yVal: 'price',
    xText: 'время (шаги)',
    yText: 'price',
    noBullets: true,
    yTooltip: ' r',
    element: cl
  }

  drawChart(inputData.map((row, i) => {
    row.step =  i;
    return row;
  }), options)
}


function drawAllHypotesColumnChart(cl) {

  const options = {
    yVal: 'count',
    yVal1: 'commulation',
    yText1: 'Колличество совпадений',
    yText2: 'Прибыльность',
    xVal: 'id',
    yNote: '%',
    xNote: 'step',
    element: cl,
    stroke: 100
  }

  drawColumnChart(all_hypoteses.sort((a, b) => b.count - a.count).slice(0, 30), options, true)
}

function drawAllHypotesColumnChartCommul(cl) {

  const options = {
    yVal: 'count',
    yVal1: 'commulation',
    xVal: 'id',
    yText1: 'Колличество совпадений',
    yText2: 'Прибыльность',
    yNote: '%',
    xNote: 'step',
    element: cl,
    stroke: 100
  }

  drawColumnChart(all_hypoteses.map(v => {
    return {
      ...v,
      string: getHypotezStr({string: v.comb.string, stepsAhead: v.stepsAhead}),
      count: v.stepsAhead * v.count
    }
  }).sort((a, b) => b.commulation - a.commulation).slice(0, 30), options, true)
}

function drawAllHypotesCommulation(cl) {
  const options = {
    yVal: 'commulate',
    yVal1: 'probability',
    xVal: 'count',
    element: cl,
    stroke: 100,
    yText1: 'прибыльность',
    yText2: 'вероятность',
    xText: 'время (шаги)'
  }

  let commulate = 1
  let count = 0
  let countSuccess = 0
  const hypotes = all_hypoteses.filter(v => v.id == all_hypoteses_id)[0]

  options.string = getHypotezStr({string: hypotes.comb.string, stepsAhead: hypotes.stepsAhead})

  drawMultipleValues(hypotes.commulate_hist.map(v => {
      count++;
      commulate = commulate * v;
      if (v >= 1) {
        countSuccess++
      }

      return {
        commulate: commulate * 100,
        count: count,
        probability: countSuccess/count
      }
    }), options)
}

function drawHypotesColumnChart(cl) {
  const options = {
    yVal: 'count',
    yVal1: 'commulation',
    xVal: 'id',
    yText1: 'Колличество использований',
    yText2: 'Прибыльность',
    yNote: '%',
    xNote: 'step',
    element: cl,
    stroke: 100
  }

  drawColumnChart(hypoteses.map(v => {
    return {
      ...v,
      string: getHypotezStr(v.obj),
      count: v.count * v.obj.stepsAhead
    }
  }).sort((a, b) => b.count - a.count), options)
}

function getHypotezStr(d) {
  return `${d.string} => v${data.config.m - 1 + d.stepsAhead}.close > v${data.config.m - 1}.close`
}

function onClickColumn(id, forAll) {
  let cl;
  if (forAll) {
    cl = 'hypotez_for_all';
    all_hypoteses_id = id
  } else {
    cl = 'hypotez';
    hypotes_id = id;
    all_hypoteses_id = id;
  }

  const f = () => {
    $(`#${cl}`).remove()
    $(`div.${cl}`).first().append( `<div id="${cl}" class="graph"></div>` );
    if (forAll) {
      drawAllHypotesCommulation(cl)
    } else {
      drawHypotesCommulation(cl)
    }
  }

  f();
  setHideFunc(cl, f);
}

function drawColumnChart(d, opt, forAll) {
  var chart = am4core.create(opt.element, am4charts.XYChart);
  chart.data = d;
  chart.scrollbarX = new am4core.Scrollbar();

  // Create axes
  var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.dataFields.category = opt.xVal;

  categoryAxis.renderer.grid.template.location = 0;
  categoryAxis.renderer.minGridDistance = 60;
  categoryAxis.tooltip.disabled = true;
  categoryAxis.title.text = 'гипотеза';

  var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  valueAxis.renderer.minWidth = 50;
  valueAxis.min = 0;
  valueAxis.cursorTooltipEnabled = false;
  if (opt.yText1) {
    valueAxis.title.text = opt.yText1
  }

  // Create series
  var series = chart.series.push(new am4charts.ColumnSeries());
  series.sequencedInterpolation = true;
  series.dataFields.valueY = opt.yVal;
  series.dataFields.categoryX = opt.xVal;
  series.tooltipText = `count: {valueY}[/]
  id: {id}
  str: {string}`;

  series.columns.template.strokeWidth = 0;

  series.tooltip.pointerOrientation = "vertical";

  series.columns.template.column.cornerRadiusTopLeft = 10;
  series.columns.template.column.cornerRadiusTopRight = 10;
  series.columns.template.column.fillOpacity = 0.8;

  series.columns.template.events.on("hit", function(ev) {
    onClickColumn(ev.target.dataItem.component.tooltipDataItem.dataContext.id, forAll)
  }, this);
  

  // on hover, make corner radiuses bigger
  var hoverState = series.columns.template.column.states.create("hover");
  hoverState.properties.cornerRadiusTopLeft = 0;
  hoverState.properties.cornerRadiusTopRight = 0;
  hoverState.properties.fillOpacity = 1;

  series.columns.template.adapter.add("fill", (fill, target)=>{
    return chart.colors.getIndex(target.dataItem.index);
  })


  var paretoValueAxis = chart.yAxes.push(new am4charts.ValueAxis());

  paretoValueAxis.renderer.opposite = true;
  paretoValueAxis.strictMinMax = true;
  paretoValueAxis.renderer.grid.template.disabled = true;
  paretoValueAxis.numberFormatter = new am4core.NumberFormatter();
  paretoValueAxis.cursorTooltipEnabled = false;
  
  if (opt.yText2) {
    paretoValueAxis.title.text = opt.yText2
  }

  var paretoSeries = chart.series.push(new am4charts.LineSeries())
  paretoSeries.dataFields.valueY = opt.yVal1;
  paretoSeries.dataFields.categoryX = opt.xVal;
  paretoSeries.yAxis = paretoValueAxis;
  paretoSeries.tooltipText = "commulation: {valueY}[/]";
  paretoSeries.bullets.push(new am4charts.CircleBullet());
  paretoSeries.strokeWidth = 2;
  paretoSeries.stroke = new am4core.InterfaceColorSet().getFor("alternativeBackground");
  paretoSeries.strokeOpacity = 0.5;

  // Cursor
  chart.cursor = new am4charts.XYCursor();
  chart.cursor.behavior = "panX";

}

function drawHypotesCommulation(cl) {
  const options = {
    yVal: 'commulate',
    yVal1: 'probability',
    xVal: 'from',
    xTitle: 'steps',
    yTitle: 'profit %',
    yText1: 'прибыльность',
    yText2: 'вероятность',
    xText: 'время (шаги)',
    yNote: '%',
    xNote: 'step',
    element: cl,
    stroke: 100
  }

  let commulate = 1

  drawMultipleValues(data.operations.filter(v => v.id == hypotes_id)
    .map(v => {
      if (!options.string) {
        options.string = getHypotezStr(v.obj)
      }
      commulate = v.profit * commulate;
      return {
        ...v,
        commulate: commulate * 100,
        probability: v.obj.probability * 100
      }
    }), options)
}

function drawMultipleValues(d, opt) {
  let chart = am4core.create(opt.element, am4charts.XYChart);

  // Increase contrast by taking evey second color
  chart.colors.step = 2;

  // Add data
  chart.data = d;

  // Create axes
  let dateAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  dateAxis.dataFields.category = opt.xVal;
  if (opt.xText) {
    dateAxis.title.text = opt.xText;
  }

  dateAxis.renderer.minGridDistance = 50;

  // Create series
  function createAxisAndSeries(field, opposite, tx) {
    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    
    let series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.valueY = field;
    series.dataFields.categoryX = opt.xVal;
    series.strokeWidth = 2;
    series.yAxis = valueAxis;
    series.name = field;
    series.tooltipText = `[bold]${field}: {${field}}[/]`;
    series.tensionX = 0.8;
    
    let interfaceColors = new am4core.InterfaceColorSet();
    
    let bullet = series.bullets.push(new am4charts.CircleBullet());
    bullet.circle.stroke = interfaceColors.getFor("background");
    
    valueAxis.renderer.line.strokeOpacity = 1;
    valueAxis.renderer.line.strokeWidth = 2;
    valueAxis.renderer.line.stroke = series.stroke;
    valueAxis.renderer.labels.template.fill = series.stroke;
    valueAxis.renderer.opposite = opposite;
    valueAxis.renderer.grid.template.disabled = true;
    if (tx) {
      valueAxis.title.text = tx
    }
  }


  createAxisAndSeries(opt.yVal, false, opt.yText1)
  createAxisAndSeries(opt.yVal1, true, opt.yText2)

  if (opt.string) {
    let title = chart.titles.create();
    title.html = `<div class=sel_hypotez> ${opt.string} </div>`;
  }

  // Add legend
  chart.legend = new am4charts.Legend();

  // Add cursor
  chart.cursor = new am4charts.XYCursor();
}

function drawProfit(cl) {
  const options = {
    yVal: 'commulate',
    xVal: 'from',
    yNote: '%',
    xText: 'время (шаги)',
    yText: 'прибыльность %',
    xNote: 'step',
    noBullets: true,
    element: cl,
    stroke: 100
  }

  let commulate = 1
  drawChart(data.operations.map(v => {
    commulate = v.profit * commulate 
    v.commulate = commulate * 100
    return v
  }), options)
}

function drawProfitOper(cl) {
  const options = {
    yVal: 'profit',
    xVal: 'from',
    xText: 'время (шаги)',
    yText: 'прибыльность %',
    yNote: '%',
    xNote: 'step',
    element: cl,
    stroke: 0
  }

  drawChart(data.operations.map(v => {
    return {
      ...v,
      profit: (v.profit - 1) * 100
    }
  }), options)
}

function drawChart(d, opt) {
    // Create chart instance
  let chart = am4core.create(opt.element, am4charts.XYChart);

  // Add data
  chart.data = d;

  // Create axes
  let xvalueAxis = chart.xAxes.push(new am4charts.ValueAxis());
  xvalueAxis.min = minStep;
  xvalueAxis.max = maxStep;
  xvalueAxis.strictMinMax = true; 
  if (opt.xText) {
    xvalueAxis.title.text = opt.xText;
  }


  // Create value axis
  let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

  valueAxis.adapter.add("getTooltipText", (text) => {
    return text + (opt.yTooltip  || " %")
  });


  if (opt.yText) {
    valueAxis.title.text = opt.yText;
  }

  // Create series
  let series = chart.series.push(new am4charts.LineSeries());
  
  series.dataFields.valueY = opt.yVal;
  series.dataFields.valueX = opt.xVal;
  series.strokeWidth = 1;

  if (!opt.noBullets) {
    let bullet = series.bullets.push(new am4charts.CircleBullet());
    bullet.circle.radius = 3
    let bullethover = bullet.states.create("hover");
    bullethover.properties.scale = 2;
    bullet.tooltipText = getDescription();
  }


  // Create a range to change stroke for values below 0
  let range = valueAxis.createSeriesRange(series);
  range.value = opt.stroke || 0;
  range.endValue = -10;
  range.contents.stroke = chart.colors.getIndex(4);
  range.contents.fill = range.contents.stroke;
  range.contents.strokeOpacity = 0.9;
  range.contents.fillOpacity = 0.2;

  // Add cursor
  chart.cursor = new am4charts.XYCursor();

  chart.scrollbarX = new am4core.Scrollbar();
  chart.scrollbarX.parent = chart.bottomAxesContainer;

}

function drawProfitSteps(cl) {
  const steps = data.config.stepsAhead;
  const options = {
    xVal: 'from',
    xTitle: 'steps',
    yTitle: 'profit %',
    xText: 'время (шаги)',
    yText: 'прибыльность %',
    yNote: '%',
    xNote: 'step',
    noBullets: true,
    element: cl,
    stroke: 100,
    steps
  }

  const commulation = new Array(steps).fill(1);

  drawMultipleChart(data.operations.map(v => {
    commulation[v.obj.stepsAhead - 1] = commulation[v.obj.stepsAhead - 1] * v.profit;
    v['steps' + v.obj.stepsAhead] = commulation[v.obj.stepsAhead - 1] * 100;
    return v
  }), options)
}


function drawMultipleChart(d, opt) {
  var chart = am4core.create(opt.element, am4charts.XYChart);

  chart.data = d;
  chart.colors.step = 7;

  // Create axes
  var dateAxis = chart.xAxes.push(new am4charts.ValueAxis());
  dateAxis.min = minStep;
  dateAxis.max = maxStep;
  dateAxis.strictMinMax = true; 
  if (opt.xText) {
    dateAxis.title.text = opt.xText
  }

  var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

  if (opt.yText) {
    valueAxis.title.text = opt.yText
  }


  valueAxis.adapter.add("getTooltipText", (text) => {
    return text + " %"
  });

  // Create series
  for (let i = 1; i <= opt.steps; i++) {
    let series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.valueY = "steps" + i;
    series.dataFields.valueX = opt.xVal;
    series.name = "steps" + i;
    //series.colors.step = 3;
    //series.fill = chart.colors.getIndex(i*4 - 2);
    if (!opt.noBullets) {
      let bullet = series.bullets.push(new am4charts.CircleBullet());
      bullet.circle.radius = 3
      let bullethover = bullet.states.create("hover");
      bullethover.properties.scale = 2;
      bullet.tooltipText = getDescription();
    } else {
      series.strokeWidth = 2;
    }
    if (i == 2) {
      let range = valueAxis.createSeriesRange(series);
      range.value = opt.stroke || 0;
      range.endValue = -10;
      range.contents.stroke = chart.colors.getIndex(10);
      range.contents.fill = range.contents.stroke;
      range.contents.strokeOpacity = 0.9;
      range.contents.fillOpacity = 0.2;
    }
  }


  chart.legend = new am4charts.Legend();
  chart.cursor = new am4charts.XYCursor();
}

function getDescription() {
  return `[bold]index {id}[/]
  ----
  steps ahead: {steps}
  probability: {obj.probability}
  commulation: {obj.commulation}`
}

drawBasic()