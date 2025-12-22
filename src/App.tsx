import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { Dashboard } from '@/pages/Dashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { Users } from '@/pages/users';
import { Profile } from '@/pages/profile';
import { Tasks } from '@/pages/tasks';
import { CalendarPage } from '@/pages/calendar';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';
import { ExampleDashboard } from '@/pages/examples/dashboard';
import { ExampleTable } from '@/pages/examples/table';
import { ExampleCard } from '@/pages/examples/card';
import { Form } from '@/pages/examples/form';
import { Blank } from '@/pages/examples/blank';

import { ProtectedRoute, AdminOnlyRoute } from '@/components/protected-route';

export function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="admin-dashboard" element={
                  <AdminOnlyRoute><AdminDashboard /></AdminOnlyRoute>
                } />
                <Route path="users" element={
                  <AdminOnlyRoute>
                    <Users />
                  </AdminOnlyRoute>
                } />
                <Route path="tasks" element={<Tasks />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="profile" element={<Profile />} />
                <Route path="examples/blank" element={<Blank />} />
                <Route path="examples/dashboard" element={<ExampleDashboard />} />
                <Route path="examples/table" element={<ExampleTable />} />
                <Route path="examples/card" element={<ExampleCard />} />
                <Route path="examples/form" element={<Form />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;