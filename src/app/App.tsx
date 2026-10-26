import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { CitiesPage } from '@/features/cities/pages/CitiesPage'
import { CityDetailPage } from '@/features/cities/pages/CityDetailPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<CitiesPage />} />
        <Route path="/cities/:cityId" element={<CityDetailPage />} />
        <Route path="*" element={<CitiesPage />} />
      </Route>
    </Routes>
  )
}
