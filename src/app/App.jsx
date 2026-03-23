import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../features/auth/hooks/useAuth';
import AppRouter from './AppRouter';
import '../index.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRouter />
            </Router>
        </AuthProvider>
    );
}

export default App;
