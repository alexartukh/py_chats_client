import { createContext, useContext, useState } from 'react'
import { TOKEN_STORAGE_KEY, LOGIN_STORAGE_KEY, login as apiLogin, logout as apiLogout } from '../api.js'

// Общее состояние входа: токен, логин пользователя и функции login/logout.
// Токен и логин хранятся и в state (чтобы компоненты перерисовывались), и в localStorage (чтобы пережить перезагрузку страницы).
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_STORAGE_KEY))
  const [userLogin, setUserLogin] = useState(localStorage.getItem(LOGIN_STORAGE_KEY))

  // api.login сохраняет токен и логин в localStorage, здесь они кладутся в state
  async function login(loginValue, password) {
    const newToken = await apiLogin(loginValue, password)
    setToken(newToken)
    setUserLogin(loginValue)
  }

  // state очищается сразу; api.logout удаляет токен и логин из localStorage и вызывает сервер
  async function logout() {
    setToken(null)
    setUserLogin(null)
    await apiLogout()
  }

  return (
    <AuthContext.Provider value={{ token: token, userLogin: userLogin, login: login, logout: logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Возвращает { token, userLogin, login, logout }. Работает только внутри <AuthProvider>.
export function useAuth() {
  return useContext(AuthContext)
}
