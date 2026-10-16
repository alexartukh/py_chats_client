import UsersList from '../components/UsersList.jsx'
import TopicsList from '../components/TopicsList.jsx'

export default function HomePage() {
  return (
    <div className="home">
      <section className="column">
        <UsersList />
      </section>
      <section className="column">
        <TopicsList />
      </section>
    </div>
  )
}
