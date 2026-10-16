import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Пускает на вложенные маршруты, только если есть токен (из AuthContext).
// Иначе перенаправляет на '/'. Срок действия токена здесь не проверяется — это делает сервер.
export default function ProtectedRoute() {
  const { token } = useAuth()
  if (!token) {
    return <Navigate to="/" replace={true} />
  }
  return <Outlet />
}
