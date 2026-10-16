import { Link } from 'react-router-dom'
import UsersList from '../components/UsersList.jsx'
import TopicsList from '../components/TopicsList.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function HomePage() {
  const { token } = useAuth()

  return (
    <div className="home">
      <section className="column">
        <UsersList />
        <Link to="/create_new_user">+ Создать пользователя</Link>
      </section>
      <section className="column">
        <TopicsList />
        {token && <Link to="/create_new_topic">+ Создать тему</Link>}
      </section>
    </div>
  )
}
