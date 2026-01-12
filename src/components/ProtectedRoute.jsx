import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component
 * Checks if user is authenticated before allowing access to protected pages
 * Redirects to /auth if not logged in
 */
const ProtectedRoute = ({ children }) => {
    // Check if user info exists in localStorage
    const userInfo = localStorage.getItem('userInfo');

    if (!userInfo) {
        // No user info = not logged in, redirect to auth page
        return <Navigate to="/auth" replace />;
    }

    try {
        const user = JSON.parse(userInfo);

        // Check if token exists
        if (!user.token) {
            return <Navigate to="/auth" replace />;
        }

        // User is authenticated, render the protected content
        return children;
    } catch (error) {
        // Invalid JSON in localStorage, redirect to auth
        return <Navigate to="/auth" replace />;
    }
};

export default ProtectedRoute;
