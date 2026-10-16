import { Outlet } from 'react-router-dom'
import MainHeader from '../components/MainHeader.jsx'
import MainFooter from '../components/MainFooter.jsx'

export default function MainLayout() {
  return (
    <>
      <MainHeader />
      <main>
        <Outlet />
      </main>
      <MainFooter />
    </>
  )
}
