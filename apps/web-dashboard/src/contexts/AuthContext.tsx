import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole, ROLE_CONFIGS } from '@/types/roles';
import { SignUpData } from '@/components/auth/SignUpForm';
import apiClient from '@/lib/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasSelectedDataSource: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  resendOTP: (email: string) => Promise<void>;
  logout: () => void;
  selectDataSource: () => void;
  getRoleConfig: () => typeof ROLE_CONFIGS[UserRole] | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hasSelectedDataSource, setHasSelectedDataSource] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.getCurrentUser();
        const userData: User = {
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role as UserRole,
          department: response.department,
          lastLogin: response.last_login || new Date().toISOString(),
        };
        setUser(userData);
        setHasSelectedDataSource(response.has_selected_data_source || false);
      } catch (error) {
        // Not authenticated or error
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(email, password);
      
      if (response.success && response.user) {
        const userData: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role as UserRole,
          department: response.user.department,
          lastLogin: response.user.last_login || new Date().toISOString(),
        };
        setUser(userData);
        setHasSelectedDataSource(response.user.has_selected_data_source || false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, []);

  const signUp = useCallback(async (data: SignUpData): Promise<boolean> => {
    try {
      // Map department to role
      const roleMap: Record<string, UserRole> = {
        'Quality Assurance': 'qa',
        'Quality Control': 'qc',
        'Manufacturing': 'production',
        'Regulatory Affairs': 'regulatory',
        'Business Development': 'sales',
        'Executive Leadership': 'management',
        'Information Technology': 'admin',
      };
      
      const role = roleMap[data.department] || 'qa';
      
      const response = await apiClient.signup({
        email: data.email,
        password: data.password,
        name: data.name,
        role,
        department: data.department,
      });
      
      return response.success || false;
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    }
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await apiClient.verifyOTP(email, otp);
      
      if (response.success && response.user) {
        const userData: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role as UserRole,
          department: response.user.department,
          lastLogin: response.user.last_login || new Date().toISOString(),
        };
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('OTP verification failed:', error);
      return false;
    }
  }, []);

  const resendOTP = useCallback(async (email: string): Promise<void> => {
    try {
      await apiClient.resendOTP(email);
    } catch (error) {
      console.error('Resend OTP failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setHasSelectedDataSource(false);
    }
  }, []);

  const selectDataSource = useCallback(async () => {
    try {
      console.log('Calling API to select data source...');
      const response = await apiClient.selectDataSource();
      console.log('API response:', response);
      setHasSelectedDataSource(true);
      console.log('Data source selected successfully');
    } catch (error) {
      console.error('Select data source failed:', error);
      throw error; // Re-throw to let the caller handle it
    }
  }, []);

  const getRoleConfig = useCallback(() => {
    if (!user) return null;
    return ROLE_CONFIGS[user.role];
  }, [user]);

  if (isLoading) {
    return <div>Loading...</div>; // You can replace with a proper loading component
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        hasSelectedDataSource,
        login,
        signUp,
        verifyOTP,
        resendOTP,
        logout,
        selectDataSource,
        getRoleConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
