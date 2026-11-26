/** Day/evening/night mood, from the visitor's local clock. */
export function timeOfDay(date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60
  if (h >= 6.5 && h < 16.5) return 'day'
  if ((h >= 16.5 && h < 19.5) || (h >= 5 && h < 6.5)) return 'dusk'
  return 'night'
}
