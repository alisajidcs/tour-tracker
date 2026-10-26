import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthProvider } from '@/features/auth/AuthContext'
import { AdminPage } from '@/features/admin/pages/AdminPage'
import { CitiesPage } from '@/features/cities/pages/CitiesPage'
import { CityDetailPage } from '@/features/cities/pages/CityDetailPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<CitiesPage />} />
          <Route path="/cities/:cityId" element={<CityDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<CitiesPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
