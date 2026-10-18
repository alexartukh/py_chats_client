// Форматирование дат с сервера для показа на странице.

// Дополняет число нулём слева до двух цифр: 5 -> "05", 12 -> "12"
function twoDigits(number) {
  if (number < 10) {
    return '0' + number
  }
  return String(number)
}

// Строка даты с сервера (ISO 8601, например "2026-10-17T21:16:14.123Z") -> "17.10.2026 21:16:14".
// Время показывается в часовом поясе браузера (сервер присылает UTC). Доли секунды отбрасываются.
// Формат собирается вручную, а не через toLocaleString: тот зависит от языка и настроек браузера.
// Если строку разобрать не удалось, возвращается она сама без изменений.
export function formatDateTime(isoString) {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return isoString
  }

  const day = twoDigits(date.getDate())
  // getMonth() считает месяцы с 0: январь — 0, поэтому +1
  const month = twoDigits(date.getMonth() + 1)
  const year = date.getFullYear()
  const hours = twoDigits(date.getHours())
  const minutes = twoDigits(date.getMinutes())
  const seconds = twoDigits(date.getSeconds())

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`
}
