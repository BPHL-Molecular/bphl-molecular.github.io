import { Route, Routes } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import TeamPage from './pages/TeamPage'
import TrainingPage from './pages/TrainingPage'
import PipelinesPage from './pages/PipelinesPage'
import NotFound from './pages/NotFound'
import RouteNavigation from './components/layout/RouteNavigation'
import './styles/globals.css'
export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <RouteNavigation />
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/pipelines" element={<PipelinesPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
