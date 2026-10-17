// Проверки полей формы — те же правила, что на сервере (C:\PRO\Django\request_check_helper.py:
// get_required_login и get_required_email). Если правила на сервере поменяются, менять и здесь.
//
// Каждая функция возвращает текст ошибки или null, если значение правильное.

// Максимальная длина login и email — как у колонок users.login и users.email VARCHAR(255)
const MAX_LOGIN_LENGTH = 255
const MAX_EMAIL_LENGTH = 255

// Поле User Name из ТЗ: только латинские буквы и цифры, не пустое, не длиннее 255.
// Набор символов задан явно [A-Za-z0-9], а не через \w: \w пропускает ещё "_".
export function getLoginError(login) {
  if (login === '') {
    return 'Логин не может быть пустым'
  }
  if (login.length > MAX_LOGIN_LENGTH) {
    return 'Логин длиннее 255 символов'
  }
  if (/^[A-Za-z0-9]+$/.test(login) === false) {
    return 'Логин может содержать только латинские буквы и цифры'
  }
  return null
}

// Адрес вида "что-то@домен.зона", не пустой, не длиннее 255.
// Ровно один "@", до него хотя бы один символ, после — домен с точкой, без пробелов.
// Существует ли такой адрес на самом деле, не проверяется.
export function getEmailError(email) {
  if (email === '') {
    return 'Email не может быть пустым'
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    return 'Email длиннее 255 символов'
  }
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) === false) {
    return 'Email должен быть адресом вида name@example.com'
  }
  return null
}
