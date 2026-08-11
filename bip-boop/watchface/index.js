import * as hmUI from '@zos/ui'
import {
  Battery,
  BloodOxygen,
  Calorie,
  HeartRate,
  Pai,
  Sleep,
  Stand,
  Step,
  Stress,
  Time,
  Weather,
} from '@zos/sensor'

const DESIGN_WIDTH = 432
const DESIGN_HEIGHT = 514
const SIMULATOR_PREVIEW = false
const WIDTH = DESIGN_WIDTH
const HEIGHT = DESIGN_HEIGHT
const scaleX = (value) => Math.round((value * WIDTH) / DESIGN_WIDTH)
const scaleY = (value) => Math.round((value * HEIGHT) / DESIGN_HEIGHT)
const scaleSize = (value) =>
  Math.round(value * Math.min(WIDTH / DESIGN_WIDTH, HEIGHT / DESIGN_HEIGHT))

const COLORS = {
  white: 0xf3f2f2,
  aodWhite: 0xbdbbbb,
  muted: 0x9b9797,
  aodMuted: 0x858383,
  orange: 0xf2620a,
  brightOrange: 0xff8c3d,
  track: 0x4e4d4c,
  black: 0x000000,
}

const FONT_REGULAR = 'fonts/archivo-regular.ttf'
const FONT_SEMIBOLD = 'fonts/archivo-semibold.ttf'
const FONT_EXTRABOLD = 'fonts/archivo-extrabold.ttf'
const NORMAL = hmUI.show_level.ONLY_NORMAL
const AOD = hmUI.show_level.ONAL_AOD

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]

const WEATHER_LABELS = [
  'Cloudy',
  'Showers',
  'Snow showers',
  'Sunny',
  'Overcast',
  'Light rain',
  'Light snow',
  'Moderate rain',
  'Moderate snow',
  'Heavy snow',
  'Heavy rain',
  'Sandstorm',
  'Rain & snow',
  'Fog',
  'Hazy',
  'Thunderstorms',
  'Snowstorm',
  'Dusty',
  'Rainstorm',
  'Rain & hail',
  'Storm & hail',
  'Rainstorm',
  'Dust',
  'Sandstorm',
  'Rainstorm',
  'Partly cloudy',
  'Cloudy night',
  'Showers night',
  'Clear night',
]

const pad2 = (value) => (value < 10 ? `0${value}` : `${value}`)
const clamp = (value, minimum, maximum) =>
  Math.min(Math.max(value, minimum), maximum)
const safeNumber = (value, fallback = 0) =>
  typeof value === 'number' && value >= 0 ? value : fallback
const safeCall = (callback, fallback) => {
  try {
    const value = callback()
    return value === undefined || value === null ? fallback : value
  } catch (error) {
    return fallback
  }
}
const formatThousands = (value) => {
  const digits = `${Math.round(safeNumber(value))}`
  let output = ''
  for (let index = 0; index < digits.length; index += 1) {
    if (index > 0 && (digits.length - index) % 3 === 0) output += ','
    output += digits[index]
  }
  return output
}
const compactTarget = (value) => {
  const number = safeNumber(value)
  if (number >= 1000 && number % 1000 === 0) return `${number / 1000}K`
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`
  return `${number}`
}
const compactDuration = (minutes) => {
  const totalMinutes = Math.round(safeNumber(minutes))
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  if (remainingMinutes === 0) return `${hours}H`
  return `${hours}H${pad2(remainingMinutes)}`
}

const text = ({
  x,
  y,
  w,
  h,
  value,
  size,
  color = COLORS.white,
  font = FONT_REGULAR,
  align = hmUI.align.LEFT,
  verticalAlign = hmUI.align.CENTER_V,
  charSpace = 0,
  showLevel = NORMAL,
}) =>
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: scaleX(x),
    y: scaleY(y),
    w: scaleX(w),
    h: scaleY(h),
    color,
    text_size: scaleSize(size),
    font,
    text: value,
    char_space: scaleSize(charSpace),
    align_h: align,
    align_v: verticalAlign,
    text_style: hmUI.text_style.ELLIPSIS,
    show_level: showLevel,
  })

const fillRect = (x, y, w, h, color, showLevel = NORMAL) =>
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: scaleX(x),
    y: scaleY(y),
    w: scaleX(w),
    h: scaleY(h),
    color,
    show_level: showLevel,
  })

const setText = (widget, value) =>
  widget.setProperty(hmUI.prop.TEXT, `${value}`)

const alignLeftMetricLabel = (widget, value, labelDesignX = 70) => {
  const fallbackWidth = scaleSize(`${value}`.length * 15)
  const valueWidth = safeCall(
    () =>
      hmUI.getTextLayout(`${value}`, {
        text_size: scaleSize(26),
        text_width: 0,
        wrapped: 0,
        font: FONT_EXTRABOLD,
      }).width,
    fallbackWidth
  )
  const labelX = scaleX(labelDesignX)
  const valueRight = scaleX(201)
  const pairGap = scaleX(14)
  const labelRight = valueRight - valueWidth - pairGap

  widget.setProperty(hmUI.prop.W, Math.max(labelRight - labelX, 1))
}

const createWeatherNumber = ({
  x,
  y,
  w,
  h,
  type,
  color,
  showLevel,
}) => {
  const root = color === 'orange' ? 'weather/orange' : 'weather/muted'
  const fontArray = []
  for (let digit = 0; digit < 10; digit += 1) {
    fontArray.push(`${root}/${digit}.png`)
  }

  const options = {
    x: scaleX(x),
    y: scaleY(y),
    w: scaleX(w),
    h: scaleY(h),
    type,
    font_array: fontArray,
    h_space: 0,
    align_h: hmUI.align.LEFT,
    show_level: showLevel,
  }

  if (SIMULATOR_PREVIEW) {
    // The native data type appends its configured unit image. Including the
    // TEXT_IMG `u` token here would render that unit a second time.
    options.text = type === hmUI.data_type.WEATHER_CURRENT ? '24' : '20'
  }

  if (color === 'orange') {
    options.negative_image = `${root}/minus.png`
    options.unit_en = `${root}/celsius.png`
    options.unit_sc = `${root}/celsius.png`
    options.unit_tc = `${root}/celsius.png`
    options.imperial_unit_en = `${root}/fahrenheit.png`
    options.imperial_unit_sc = `${root}/fahrenheit.png`
    options.imperial_unit_tc = `${root}/fahrenheit.png`
  } else {
    options.unit_en = `${root}/percent.png`
    options.unit_sc = `${root}/percent.png`
    options.unit_tc = `${root}/percent.png`
    options.imperial_unit_en = `${root}/percent.png`
    options.imperial_unit_sc = `${root}/percent.png`
    options.imperial_unit_tc = `${root}/percent.png`
  }

  return hmUI.createWidget(hmUI.widget.TEXT_IMG, options)
}

WatchFace({
  onInit() {
    this.time = new Time()
    this.steps = new Step()
    this.calories = new Calorie()
    this.battery = new Battery()
    this.heart = new HeartRate()
    this.sleep = new Sleep()
    this.stress = new Stress()
    this.spo2 = new BloodOxygen()
    this.pai = new Pai()
    this.stand = new Stand()
    this.weather = new Weather()
  },

  build() {
    hmUI.createWidget(hmUI.widget.IMG, {
      x: 0,
      y: 0,
      src: 'background/regular.png',
      show_level: NORMAL,
    })
    hmUI.createWidget(hmUI.widget.IMG, {
      x: 0,
      y: 0,
      src: 'background/aod.png',
      show_level: AOD,
    })

    fillRect(73, 52, 286, 3, COLORS.orange)
    fillRect(0, 312, 432, 2, 0x646261)
    fillRect(0, 408, 432, 2, 0x646261)
    fillRect(215, 219, 2, 285, 0x646261)

    text({
      x: 29,
      y: 320,
      w: 62,
      h: 28,
      value: 'HEART',
      size: 14,
      color: COLORS.muted,
      font: FONT_SEMIBOLD,
      charSpace: 2,
    })
    fillRect(96, 332, 4, 4, COLORS.muted)
    text({
      x: 111,
      y: 320,
      w: 68,
      h: 28,
      value: 'BPM',
      size: 14,
      color: COLORS.muted,
      font: FONT_SEMIBOLD,
      charSpace: 2,
    })
    text({
      x: 230,
      y: 320,
      w: 66,
      h: 28,
      value: 'SLEEP',
      size: 14,
      color: COLORS.muted,
      font: FONT_SEMIBOLD,
      charSpace: 2,
    })
    fillRect(301, 332, 4, 4, COLORS.muted)
    this.sleepGoalLabel = text({
      x: 316,
      y: 320,
      w: 90,
      h: 28,
      value: '--',
      size: 14,
      color: COLORS.muted,
      font: FONT_SEMIBOLD,
      charSpace: 2,
    })
    this.spo2Label = text({
      x: 70,
      y: 414,
      w: 77,
      h: 36,
      value: 'SpO₂',
      size: 14,
      color: COLORS.muted,
      font: FONT_SEMIBOLD,
      align: hmUI.align.RIGHT,
      charSpace: 2,
    })
    this.standLabel = text({
      x: 26,
      y: 452,
      w: 121,
      h: 36,
      value: 'STAND',
      size: 14,
      color: COLORS.muted,
      font: FONT_SEMIBOLD,
      align: hmUI.align.RIGHT,
      charSpace: 2,
    })
    text({
      x: 230,
      y: 414,
      w: 32,
      h: 36,
      value: 'PAI',
      size: 14,
      color: COLORS.muted,
      font: FONT_SEMIBOLD,
      charSpace: 2,
    })
    text({
      x: 230,
      y: 452,
      w: 70,
      h: 36,
      value: 'STRESS',
      size: 14,
      color: COLORS.muted,
      font: FONT_SEMIBOLD,
      charSpace: 2,
    })

    const heartBars = [
      [30, 393, 17, 6, COLORS.muted],
      [49, 389, 17, 10, COLORS.muted],
      [68, 391, 17, 8, COLORS.muted],
      [87, 386, 17, 13, COLORS.muted],
      [106, 390, 17, 9, COLORS.muted],
      [127, 383, 16, 16, COLORS.orange],
      [145, 388, 17, 11, COLORS.muted],
      [164, 391, 17, 8, COLORS.muted],
      [183, 387, 17, 12, COLORS.muted],
    ]
    heartBars.forEach(([x, y, w, h, color]) => fillRect(x, y, w, h, color))

    hmUI.createWidget(hmUI.widget.IMG, {
      x: scaleX(271),
      y: scaleY(187),
      src: 'weather/rain.png',
      show_level: NORMAL | AOD,
    })

    this.normalDate = text({
      x: 111,
      y: 14,
      w: 140,
      h: 28,
      value: 'TUE 11 AUG',
      size: 17,
      color: COLORS.white,
      font: FONT_EXTRABOLD,
      align: hmUI.align.CENTER_H,
      charSpace: 2,
    })
    this.aodDate = text({
      x: 111,
      y: 14,
      w: 140,
      h: 28,
      value: 'TUE 11 AUG',
      size: 17,
      color: COLORS.aodWhite,
      font: FONT_EXTRABOLD,
      align: hmUI.align.CENTER_H,
      charSpace: 2,
      showLevel: AOD,
    })

    this.normalBattery = text({
      x: 260,
      y: 14,
      w: 58,
      h: 28,
      value: '84%',
      size: 17,
      color: COLORS.brightOrange,
      font: FONT_EXTRABOLD,
      align: hmUI.align.CENTER_H,
      charSpace: 2,
    })
    this.aodBattery = text({
      x: 260,
      y: 14,
      w: 58,
      h: 28,
      value: '84%',
      size: 17,
      color: COLORS.brightOrange,
      font: FONT_EXTRABOLD,
      align: hmUI.align.CENTER_H,
      charSpace: 2,
      showLevel: AOD,
    })

    this.normalTime = text({
      x: 55,
      y: 61,
      w: 324,
      h: 116,
      value: '17:11',
      size: 120,
      color: COLORS.white,
      font: FONT_EXTRABOLD,
      align: hmUI.align.CENTER_H,
      charSpace: -7,
    })

    this.aodTimeOutline = []
    const outlineOffsets = [
      [-2, -2],
      [0, -2],
      [2, -2],
      [-2, 0],
      [2, 0],
      [-2, 2],
      [0, 2],
      [2, 2],
    ]
    outlineOffsets.forEach(([offsetX, offsetY]) => {
      this.aodTimeOutline.push(
        text({
          x: 55 + offsetX,
          y: 61 + offsetY,
          w: 324,
          h: 116,
          value: '17:11',
          size: 120,
          color: COLORS.aodWhite,
          font: FONT_EXTRABOLD,
          align: hmUI.align.CENTER_H,
          charSpace: -7,
          showLevel: AOD,
        })
      )
    })
    this.aodTimeFill = text({
      x: 55,
      y: 61,
      w: 324,
      h: 116,
      value: '17:11',
      size: 120,
      color: COLORS.black,
      font: FONT_EXTRABOLD,
      align: hmUI.align.CENTER_H,
      charSpace: -7,
      showLevel: AOD,
    })

    createWeatherNumber({
      x: 106,
      y: 181,
      w: 58,
      h: 26,
      type: hmUI.data_type.WEATHER_CURRENT,
      color: 'orange',
      showLevel: NORMAL,
    })
    createWeatherNumber({
      x: 106,
      y: 181,
      w: 58,
      h: 26,
      type: hmUI.data_type.WEATHER_CURRENT,
      color: 'orange',
      showLevel: AOD,
    })

    this.normalWeather = text({
      x: 164,
      y: 178,
      w: 104,
      h: 30,
      value: 'Partly cloudy',
      size: 16,
      color: COLORS.muted,
      font: FONT_REGULAR,
    })
    this.aodWeather = text({
      x: 164,
      y: 178,
      w: 104,
      h: 30,
      value: 'Partly cloudy',
      size: 16,
      color: COLORS.aodMuted,
      font: FONT_REGULAR,
      showLevel: AOD,
    })

    createWeatherNumber({
      x: 288,
      y: 183,
      w: 42,
      h: 23,
      type: hmUI.data_type.HUMIDITY,
      color: 'muted',
      showLevel: NORMAL,
    })
    createWeatherNumber({
      x: 288,
      y: 183,
      w: 42,
      h: 23,
      type: hmUI.data_type.HUMIDITY,
      color: 'muted',
      showLevel: AOD,
    })

    text({
      x: 26,
      y: 225,
      w: 62,
      h: 28,
      value: 'STEPS',
      size: 14,
      color: COLORS.muted,
      font: FONT_SEMIBOLD,
      charSpace: 2,
    })
    fillRect(93, 237, 4, 4, COLORS.muted)
    this.stepsGoalLabel = text({
      x: 108,
      y: 225,
      w: 93,
      h: 28,
      value: '10K',
      size: 14,
      color: COLORS.muted,
      font: FONT_SEMIBOLD,
      charSpace: 2,
    })
    this.stepsValue = text({
      x: 25,
      y: 250,
      w: 180,
      h: 43,
      value: '8,342',
      size: 36,
      color: COLORS.white,
      font: FONT_EXTRABOLD,
      charSpace: -1,
    })

    text({
      x: 231,
      y: 225,
      w: 52,
      h: 28,
      value: 'KCAL',
      size: 14,
      color: COLORS.muted,
      font: FONT_SEMIBOLD,
      charSpace: 2,
    })
    fillRect(288, 237, 4, 4, COLORS.muted)
    this.caloriesGoalLabel = text({
      x: 303,
      y: 225,
      w: 103,
      h: 28,
      value: '600',
      size: 14,
      color: COLORS.muted,
      font: FONT_SEMIBOLD,
      charSpace: 2,
    })
    this.caloriesValue = text({
      x: 231,
      y: 250,
      w: 175,
      h: 43,
      value: '512',
      size: 36,
      color: COLORS.white,
      font: FONT_EXTRABOLD,
      charSpace: -1,
    })

    fillRect(26, 297, 175, 5, COLORS.track)
    fillRect(231, 297, 175, 5, COLORS.track)
    fillRect(231, 393, 171, 5, COLORS.track)
    this.stepsProgress = fillRect(26, 297, 1, 5, COLORS.orange)
    this.caloriesProgress = fillRect(231, 297, 1, 5, COLORS.orange)
    this.sleepProgress = fillRect(231, 393, 1, 5, COLORS.orange)

    this.heartValue = text({
      x: 29,
      y: 343,
      w: 126,
      h: 44,
      value: '72',
      size: 36,
      color: COLORS.white,
      font: FONT_EXTRABOLD,
      charSpace: -1,
    })
    this.sleepValue = text({
      x: 231,
      y: 343,
      w: 175,
      h: 44,
      value: '6H52',
      size: 36,
      color: COLORS.white,
      font: FONT_EXTRABOLD,
      charSpace: -1,
    })

    this.spo2Value = text({
      x: 156,
      y: 414,
      w: 45,
      h: 36,
      value: '98',
      size: 26,
      color: COLORS.white,
      font: FONT_EXTRABOLD,
      align: hmUI.align.RIGHT,
    })
    this.paiValue = text({
      x: 276,
      y: 414,
      w: 45,
      h: 36,
      value: '118',
      size: 26,
      color: COLORS.white,
      font: FONT_EXTRABOLD,
    })
    this.standValue = text({
      x: 130,
      y: 452,
      w: 71,
      h: 36,
      value: '9/12',
      size: 26,
      color: COLORS.white,
      font: FONT_EXTRABOLD,
      align: hmUI.align.RIGHT,
    })
    this.stressValue = text({
      x: 312,
      y: 452,
      w: 82,
      h: 36,
      value: '34',
      size: 26,
      color: COLORS.white,
      font: FONT_EXTRABOLD,
    })

    this.refresh = () => {
      const hour = pad2(safeCall(() => this.time.getHours(), 0))
      const minute = pad2(safeCall(() => this.time.getMinutes(), 0))
      const timeValue = `${hour}:${minute}`
      const weekday = WEEKDAYS[safeCall(() => this.time.getDay(), 1) - 1] || 'MON'
      const month = MONTHS[safeCall(() => this.time.getMonth(), 1) - 1] || 'JAN'
      const dateValue = `${weekday} ${safeCall(() => this.time.getDate(), 1)} ${month}`
      const battery = safeNumber(safeCall(() => this.battery.getCurrent(), 0))
      const steps = safeNumber(safeCall(() => this.steps.getCurrent(), 0))
      const stepTarget = safeNumber(safeCall(() => this.steps.getTarget(), 10000), 10000)
      const calories = safeNumber(safeCall(() => this.calories.getCurrent(), 0))
      const calorieTarget = safeNumber(
        safeCall(() => this.calories.getTarget(), 600),
        600
      )
      const heart = safeNumber(safeCall(() => this.heart.getLast(), 0))
      const sleepInfo = safeCall(() => this.sleep.getInfo(), {})
      const sleepMinutes = safeNumber(sleepInfo.totalTime)
      const sleepTarget = safeNumber(
        safeCall(() => hmSetting.getSleepTarget(), 0)
      )
      const stressResult = safeCall(() => this.stress.getCurrent(), {})
      const spo2Result = safeCall(() => this.spo2.getCurrent(), {})
      const spo2 = safeNumber(spo2Result.value)
      const pai = safeNumber(safeCall(() => this.pai.getTotal(), 0))
      const stand = safeNumber(safeCall(() => this.stand.getCurrent(), 0))
      const standTarget = safeNumber(safeCall(() => this.stand.getTarget(), 12), 12)

      setText(this.normalDate, dateValue)
      setText(this.aodDate, dateValue)
      setText(this.normalBattery, `${battery}%`)
      setText(this.aodBattery, `${battery}%`)
      setText(this.normalTime, timeValue)
      this.aodTimeOutline.forEach((widget) => setText(widget, timeValue))
      setText(this.aodTimeFill, timeValue)

      setText(this.stepsGoalLabel, compactTarget(stepTarget))
      setText(this.stepsValue, formatThousands(steps))
      setText(this.caloriesGoalLabel, formatThousands(calorieTarget))
      setText(this.caloriesValue, formatThousands(calories))
      setText(this.heartValue, heart)
      setText(
        this.sleepGoalLabel,
        sleepTarget > 0 ? compactDuration(sleepTarget) : '--'
      )
      setText(
        this.sleepValue,
        compactDuration(sleepMinutes)
      )
      setText(this.spo2Value, spo2)
      setText(this.paiValue, pai)
      alignLeftMetricLabel(this.spo2Label, spo2)
      setText(this.standValue, `${stand}/${standTarget}`)
      alignLeftMetricLabel(this.standLabel, `${stand}/${standTarget}`, 26)
      setText(this.stressValue, safeNumber(stressResult.value))

      const stepWidth = Math.round(175 * clamp(steps / Math.max(stepTarget, 1), 0, 1))
      const calorieWidth = Math.round(
        175 * clamp(calories / Math.max(calorieTarget, 1), 0, 1)
      )
      const sleepWidth = Math.round(
        171 * clamp(sleepMinutes / Math.max(sleepTarget, 1), 0, 1)
      )
      this.stepsProgress.setProperty(hmUI.prop.W, scaleX(Math.max(stepWidth, 1)))
      this.caloriesProgress.setProperty(hmUI.prop.W, scaleX(Math.max(calorieWidth, 1)))
      this.sleepProgress.setProperty(hmUI.prop.W, scaleX(Math.max(sleepWidth, 1)))

      const forecast = safeCall(() => this.weather.getForecastWeather(), {})
      const forecastData = forecast.forecastData || {}
      const today = forecastData.data && forecastData.data[0]
      const weatherIndex = today ? today.index : 25
      const weatherLabel = WEATHER_LABELS[weatherIndex] || 'Partly cloudy'
      setText(this.normalWeather, weatherLabel)
      setText(this.aodWeather, weatherLabel)
    }

    this.refresh()
    this.clockTimer = setInterval(this.refresh, 1000)
  },

  onDestroy() {
    if (this.clockTimer) clearInterval(this.clockTimer)
  },
})
