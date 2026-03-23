import { useContext } from 'react';
import { AuthContext, AuthProvider } from '../context/AuthContext';

export const useAuth = () => useContext(AuthContext);
export { AuthProvider };
