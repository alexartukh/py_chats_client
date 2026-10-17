import { useEffect, useState } from 'react'
import { getAllRootMessages } from '../api.js'
import { isMessageCorrect } from '../messageMarkup.js'

// Поля, по которым можно сортировать таблицу (по ТЗ: User Name, E-mail, дата добавления).
// Ключ — имя поля в ответе сервера.
const SORT_FIELD_LOGIN = 'user__login'
const SORT_FIELD_EMAIL = 'user__email'
const SORT_FIELD_CREATED_AT = 'created_at'

const SORT_DIRECTION_ASC = 'asc'
const SORT_DIRECTION_DESC = 'desc'

// Сравнивает два сообщения по полю sortField по возрастанию: <0 — a раньше b, >0 — позже, 0 — равны.
// Строки сравниваются через localeCompare (учитывает алфавит, а не коды символов).
// created_at сравнивается через Date.parse: сервер пишет дробную часть секунд не всегда,
// и строки "…:00Z" и "…:00.123Z" сравнились бы неверно.
// Если сервер не прислал поле (undefined или null), оно считается пустой строкой.
// При равенстве порядок определяет message_id, чтобы строки не прыгали между собой.
function compareMessages(a, b, sortField) {
  let difference = 0
  if (sortField === SORT_FIELD_CREATED_AT) {
    difference = Date.parse(a.created_at) - Date.parse(b.created_at)
  } else {
    let aValue = a[sortField]
    let bValue = b[sortField]
    if (aValue === undefined || aValue === null) {
      aValue = ''
    }
    if (bValue === undefined || bValue === null) {
      bValue = ''
    }
    difference = aValue.localeCompare(bValue)
  }

  if (difference !== 0) {
    return difference
  }
  return a.message_id - b.message_id
}

// Таблица корневых сообщений темы (тех, что не являются ответом). Не дерево: ответы здесь не показываются.
// Пропсы:
//   topicId — id темы; при его изменении сообщения загружаются заново
//   reloadVersion — число; при его изменении сообщения тоже загружаются заново.
//     Родитель увеличивает его, когда таблицу нужно обновить (после добавления или удаления сообщения)
// Сортировка — только на клиенте, по клику на заголовок "Автор", "Email" или "Создано".
// Повторный клик по тому же заголовку меняет направление. По умолчанию — новые сверху (LIFO, по ТЗ).
export default function RootMessages({ topicId, reloadVersion }) {
  const [rootMessages, setRootMessages] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState(SORT_FIELD_CREATED_AT)
  const [sortDirection, setSortDirection] = useState(SORT_DIRECTION_DESC)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAllRootMessages(topicId)
      .then(setRootMessages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [topicId, reloadVersion])

  // Клик по заголовку: тот же столбец — сменить направление, другой столбец — сортировать по нему по возрастанию
  function handleSortClick(field) {
    if (field === sortField) {
      if (sortDirection === SORT_DIRECTION_ASC) {
        setSortDirection(SORT_DIRECTION_DESC)
      } else {
        setSortDirection(SORT_DIRECTION_ASC)
      }
    } else {
      setSortField(field)
      setSortDirection(SORT_DIRECTION_ASC)
    }
  }

  // Стрелка у заголовка, по которому сейчас отсортировано; у остальных — ничего
  function getSortArrow(field) {
    if (field !== sortField) {
      return ''
    }
    if (sortDirection === SORT_DIRECTION_ASC) {
      return ' ▲'
    }
    return ' ▼'
  }

  // Отсортированная копия: сам rootMessages (ответ сервера) не меняется
  const sortedMessages = []
  for (const message of rootMessages) {
    sortedMessages.push(message)
  }
  sortedMessages.sort((a, b) => {
    const ascendingResult = compareMessages(a, b, sortField)
    if (sortDirection === SORT_DIRECTION_DESC) {
      return -ascendingResult
    }
    return ascendingResult
  })

  return (
    <div className="root-messages">
      <h3>Корневые сообщения</h3>
      {loading && <p>Загрузка...</p>}
      {error && <p className="error">Ошибка: {error}</p>}
      {!loading && !error && rootMessages.length === 0 && <p>Корневых сообщений нет</p>}
      {rootMessages.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th className="sortable-header" onClick={() => handleSortClick(SORT_FIELD_LOGIN)}>
                Автор{getSortArrow(SORT_FIELD_LOGIN)}
              </th>
              <th className="sortable-header" onClick={() => handleSortClick(SORT_FIELD_EMAIL)}>
                Email{getSortArrow(SORT_FIELD_EMAIL)}
              </th>
              <th>Сообщение</th>
              <th>Файл</th>
              <th className="sortable-header" onClick={() => handleSortClick(SORT_FIELD_CREATED_AT)}>
                Создано{getSortArrow(SORT_FIELD_CREATED_AT)}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMessages.map((message) => (
              <tr key={message.message_id}>
                <td>{message.message_id}</td>
                <td>{message.user__login}</td>
                {/* Сервер пока не отдаёт user__email — тогда ячейка пустая */}
                <td>{message.user__email}</td>
                {/* Как в плашке сообщения на TopicPage: HTML только если isMessageCorrect вернула true, иначе обычный текст */}
                {isMessageCorrect(message.t) ? (
                  <td className="message-text" dangerouslySetInnerHTML={{ __html: message.t }} />
                ) : (
                  <td className="message-text">{message.t}</td>
                )}
                {/* Без файла сервер отдаёт attachment_name как null; в таблице только имя файла, без содержимого */}
                <td>{message.attachment_name !== null ? message.attachment_name : ''}</td>
                <td>{message.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
