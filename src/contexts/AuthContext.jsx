import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { createFamily } from '../utils/familyUtils';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email, password, name, role = 'member', familyId = null) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    let newFamilyId = familyId;
    
    // If admin and no familyId provided, create new family
    if (role === 'admin' && !familyId) {
      try {
        const familyData = await createFamily(
          { uid: user.uid, name, email },
          `${name.split(' ')[0]}'s Family`
        );
        newFamilyId = familyData.familyId;
      } catch (error) {
        console.error('Error creating family:', error);
        // Fallback to simple familyId if family creation fails
        newFamilyId = `family_${user.uid}`;
      }
    }
    
    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      name: name,
      email: email,
      role: role,
      familyId: newFamilyId || `family_${user.uid}`,
      linkedDrive: 'drive_account_1',
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    setUserProfile(userProfile);
    
    return user;
  };

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user profile exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user profile for new Google sign-in users
      const userProfile = {
        uid: user.uid,
        name: user.displayName || 'User',
        email: user.email,
        role: 'member',
        familyId: `family_${user.uid}`,
        linkedDrive: 'drive_account_1',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid), userProfile);
    }
    
    return result;
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        
        if (user) {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            console.warn('User profile not found in Firestore');
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
