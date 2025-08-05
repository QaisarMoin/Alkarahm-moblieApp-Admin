import { createContext, useState, useEffect, ReactNode, FC } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profile?: {
    phone?: string;
    dob?: string;
    avatar?: string;
    [key: string]: any;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isGuest: boolean;
  loginAction: (data: { user: User; token: string | null }) => Promise<void>;
  logoutAction: () => Promise<void>;
  revokeGuestMode: () => Promise<void>;
  invokeGuestMode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const [storedUser, storedToken, guestFlag] = await Promise.all([
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('userToken'),
          AsyncStorage.getItem('guestMode'),
        ]);

        setIsGuest(guestFlag !== 'false'); // default true if not explicitly false
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedToken) setToken(storedToken);
      } catch (e) {
        console.error('Error loading auth state:', e);
        setUser(null);
        setToken(null);
        setIsGuest(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const loginAction = async ({ user, token }: { user: User; token: string | null }) => {
    try {
      setUser(user);
      setToken(token);
      setIsGuest(false);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      if (token) {
        await AsyncStorage.setItem('userToken', token);
      } else {
        await AsyncStorage.removeItem('userToken');
      }
      await AsyncStorage.setItem('guestMode', 'false');
    } catch (e) {
      console.error('Error saving auth state:', e);
      throw e;
    }
  };

  const logoutAction = async () => {
    try {
      setUser(null);
      setToken(null);
      await AsyncStorage.multiRemove(['userData', 'userToken']);
      await AsyncStorage.setItem('guestMode', 'true');
    } catch (e) {
      console.error('Error clearing auth state:', e);
      throw e;
    }
  };

  const revokeGuestMode = async () => {
    try {
      setIsGuest(false);
      await AsyncStorage.setItem('guestMode', 'false');

    } catch (e) {
      console.error('Failed to revoke guest mode:', e);
    }
  };

  const invokeGuestMode = async () => {
    try {
      setUser(null);
      setToken(null);
      setIsGuest(true);
      await AsyncStorage.multiRemove(['userData', 'userToken']);
      await AsyncStorage.setItem('guestMode', 'true');
    } catch (e) {
      console.error('Failed to invoke guest mode:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isGuest,
        loginAction,
        logoutAction,
        revokeGuestMode,
        invokeGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
