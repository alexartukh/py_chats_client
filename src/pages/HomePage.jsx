import { Link } from 'react-router-dom'
import UsersList from '../components/UsersList.jsx'
import TopicsList from '../components/TopicsList.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function HomePage() {
  const { token } = useAuth()

  return (
    <div className="home">
      <section className="column">
        <Link to="/create_new_user">+ Создать пользователя</Link>
        <UsersList />
      </section>
      <section className="column">
        {token && <Link to="/create_new_topic">+ Создать тему</Link>}
        <TopicsList />
      </section>
    </div>
  )
}
