const groups = [
  [[0], 'Clear sky', 'clear'],
  [[1], 'Mainly clear', 'clear'],
  [[2], 'Partly cloudy', 'partly'],
  [[3], 'Overcast', 'cloudy'],
  [[45], 'Fog', 'fog'],
  [[48], 'Depositing rime fog', 'fog'],
  [[51], 'Light drizzle', 'rain'],
  [[53], 'Moderate drizzle', 'rain'],
  [[55], 'Dense drizzle', 'rain'],
  [[56, 57], 'Freezing drizzle', 'sleet'],
  [[61], 'Light rain', 'rain'],
  [[63], 'Moderate rain', 'rain'],
  [[65], 'Heavy rain', 'rain'],
  [[66, 67], 'Freezing rain', 'sleet'],
  [[71], 'Light snowfall', 'snow'],
  [[73], 'Moderate snowfall', 'snow'],
  [[75], 'Heavy snowfall', 'snow'],
  [[77], 'Snow grains', 'snow'],
  [[80], 'Light rain showers', 'rain'],
  [[81], 'Moderate rain showers', 'rain'],
  [[82], 'Violent rain showers', 'rain'],
  [[85, 86], 'Snow showers', 'snow'],
  [[95], 'Thunderstorm', 'storm'],
  [[96, 99], 'Thunderstorm with hail', 'storm'],
]
export function weatherCondition(code) {
  const match = groups.find(([codes]) => codes.includes(code))
  return match
    ? { label: match[1], kind: match[2] }
    : { label: 'Conditions unavailable', kind: 'unknown' }
}
export function weatherTheme(code, isDay) {
  if (isDay === false) return 'night'
  const kind = weatherCondition(code).kind
  return (
    {
      clear: 'sunny',
      partly: 'cloudy',
      cloudy: 'cloudy',
      fog: 'cloudy',
      rain: 'rainy',
      sleet: 'rainy',
      snow: 'snowy',
      storm: 'stormy',
    }[kind] || 'calm'
  )
}
