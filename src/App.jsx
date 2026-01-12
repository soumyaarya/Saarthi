import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Assignments from './pages/Assignments'
import AssignmentDetail from './pages/AssignmentDetail'
import Notes from './pages/Notes'
import UserNotRegisteredError from './components/UserNotRegisteredError'
import Auth from './pages/Auth'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Navigate to="/auth" replace />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/assignments" element={
                            <ProtectedRoute>
                                <Assignments />
                            </ProtectedRoute>
                        } />
                        <Route path="/assignment" element={
                            <ProtectedRoute>
                                <AssignmentDetail />
                            </ProtectedRoute>
                        } />
                        <Route path="/notes" element={
                            <ProtectedRoute>
                                <Notes />
                            </ProtectedRoute>
                        } />
                        <Route path="/error" element={<UserNotRegisteredError />} />
                    </Routes>
                </BrowserRouter>
            </ErrorBoundary>
        </QueryClientProvider>
    )
}

export default App
