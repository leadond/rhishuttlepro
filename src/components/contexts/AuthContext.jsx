import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { UserEntity } from "@/api/appEntities";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get the ID token
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('auth_token', token);

        try {
          // Fetch user from database to get roles
          const dbUser = await UserEntity.filter({ email: firebaseUser.email });
          const userRoles = dbUser && dbUser.length > 0 ? dbUser[0].roles || [] : [];

          // Map Firebase user to our app's user structure
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            full_name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            avatar_url: firebaseUser.photoURL,
            roles: userRoles
          });
        } catch (error) {
          console.error('Error fetching user roles:', error);
          // Fallback to empty roles if fetch fails
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            full_name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            avatar_url: firebaseUser.photoURL,
            roles: []
          });
        }
      } else {
        localStorage.removeItem('auth_token');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const register = async (email, password, fullName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, {
      displayName: fullName
    });
    return result;
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Compatibility layer for existing app code that expects User.me()
  const me = async () => {
    return new Promise((resolve, reject) => {
      if (!loading) {
        if (user) resolve(user);
        else reject('Not logged in');
      } else {
        // Wait for loading to finish (simple poll for now)
        const check = setInterval(() => {
          if (!loading) {
            clearInterval(check);
            if (user) resolve(user);
            else reject('Not logged in');
          }
        }, 100);
      }
    });
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    resetPassword,
    me // For compatibility
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Export a static-like object for compatibility with existing code
// This is a bit of a hack to support `User.me()` calls outside of hooks
// Ideally, we should refactor all `User.me()` calls to `useAuth()` hook.
export const UserAuthStatic = {
  me: async () => {
    return new Promise(async (resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (u) => {
        unsubscribe();
        if (u) {
          try {
            const dbUser = await UserEntity.filter({ email: u.email });
            const userRoles = dbUser && dbUser.length > 0 ? dbUser[0].roles || [] : [];
            resolve({
              id: u.uid,
              email: u.email,
              full_name: u.displayName,
              roles: userRoles
            });
          } catch (error) {
            console.error('Error fetching user roles in static:', error);
            resolve({
              id: u.uid,
              email: u.email,
              full_name: u.displayName,
              roles: []
            });
          }
        } else {
          reject('Not logged in');
        }
      });
    });
  },
  logout: () => signOut(auth)
};
