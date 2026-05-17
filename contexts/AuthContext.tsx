"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User } from "@/lib/types";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role?: User["role"],
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        if (snap.exists()) {
          setUser({ id: snap.id, ...snap.data() } as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signIn(email: string, password: string) {
    if (!auth) throw new Error("Firebase is not configured");
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(
    email: string,
    password: string,
    name: string,
    role: User["role"] = "consumer",
  ) {
    if (!auth || !db) throw new Error("Firebase is not configured");
    const { user: fbUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const userData: Omit<User, "id"> = {
      role,
      name,
      email,
      addresses: [],
      favourites: [],
      createdAt: new Date(),
    };
    await setDoc(doc(db, "users", fbUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
    });
    setUser({ id: fbUser.uid, ...userData });
  }

  async function signInWithGoogle() {
    if (!auth || !db) throw new Error("Firebase is not configured");
    const provider = new GoogleAuthProvider();
    const { user: fbUser } = await signInWithPopup(auth, provider);
    const snap = await getDoc(doc(db, "users", fbUser.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, "users", fbUser.uid), {
        role: "consumer",
        name: fbUser.displayName ?? "User",
        email: fbUser.email ?? "",
        addresses: [],
        favourites: [],
        createdAt: serverTimestamp(),
      });
    }
  }

  async function signOut() {
    if (!auth) return;
    await firebaseSignOut(auth);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
