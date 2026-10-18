import { useEffect, useState } from 'react'
import { USERS_URL, getJson } from '../api.js'
import { formatDateTime } from '../dateFormat.js'

export default function UsersList() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJson(USERS_URL)
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h2>Пользователи</h2>
      {loading && <p>Загрузка...</p>}
      {error && <p className="error">Ошибка: {error}</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Логин</th>
            <th>Почта</th>
            <th>Создан</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id}>
              <td>{user.login}</td>
              <td>{user.email}</td>
              <td>{formatDateTime(user.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
