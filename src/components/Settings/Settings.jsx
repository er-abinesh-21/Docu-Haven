import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { joinFamily, createFamily, getFamilyByCode } from '../../utils/familyUtils';
import Navbar from '../Layout/Navbar';
import { Settings as SettingsIcon, User, Shield, Save, AlertCircle, CheckCircle, Users, Copy } from 'lucide-react';

const Settings = () => {
  const { currentUser, userProfile } = useAuth();
  const [name, setName] = useState(userProfile?.name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [familyData, setFamilyData] = useState(null);
  const [showJoinFamily, setShowJoinFamily] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [familyCode, setFamilyCode] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [editingCode, setEditingCode] = useState(false);
  const [newFamilyCode, setNewFamilyCode] = useState('');
  const [updatingCode, setUpdatingCode] = useState(false);

  useEffect(() => {
    if (userProfile?.role === 'admin' && userProfile?.familyId) {
      fetchFamilyData();
    }
  }, [userProfile]);

  const fetchFamilyData = async () => {
    try {
      console.log('Fetching family data for:', userProfile.familyId);
      const familyDoc = await getDoc(doc(db, 'families', userProfile.familyId));
      if (familyDoc.exists()) {
        console.log('Family data found:', familyDoc.data());
        setFamilyData(familyDoc.data());
      } else {
        console.log('No family document found, creating one...');
        // Create family document if it doesn't exist
        const familyData = {
          familyId: userProfile.familyId,
          familyName: `${userProfile.name.split(' ')[0]}'s Family`,
          familyCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          adminId: userProfile.uid,
          members: [{
            uid: userProfile.uid,
            name: userProfile.name,
            email: currentUser.email,
            role: 'admin',
            joinedAt: new Date().toISOString()
          }],
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'families', userProfile.familyId), familyData);
        setFamilyData(familyData);
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
    }
  };

  const copyFamilyCode = () => {
    if (familyData?.familyCode) {
      navigator.clipboard.writeText(familyData.familyCode);
      setMessage({ type: 'success', text: 'Family code copied to clipboard!' });
    }
  };

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a family code' });
      return;
    }

    try {
      setJoining(true);
      const newFamilyId = await joinFamily(joinCode, {
        uid: currentUser.uid,
        name: userProfile.name,
        email: currentUser.email
      });
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        familyId: newFamilyId,
        role: 'member'
      });
      
      setMessage({ type: 'success', text: 'Successfully joined family!' });
      setShowJoinFamily(false);
      setJoinCode('');
      
      // Refresh page to update user profile
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setJoining(false);
    }
  };

  const handleCreateFamily = async () => {
    if (!familyCode.trim() || !familyName.trim()) {
      setMessage({ type: 'error', text: 'Please enter both family name and code' });
      return;
    }

    if (familyCode.length < 4 || familyCode.length > 10) {
      setMessage({ type: 'error', text: 'Family code must be 4-10 characters' });
      return;
    }

    try {
      setCreatingFamily(true);
      
      // Check if family code already exists
      const existingFamily = await getFamilyByCode(familyCode.toUpperCase());
      if (existingFamily) {
        setMessage({ type: 'error', text: 'Family code already exists. Please choose another.' });
        return;
      }
      
      // Create family with user-chosen code
      const userName = name || userProfile?.name || 'User';
      const familyId = `family_${Date.now()}`;
      
      const familyData = {
        familyId,
        familyName: familyName.trim(),
        familyCode: familyCode.toUpperCase(),
        adminId: currentUser.uid,
        members: [{
          uid: currentUser.uid,
          name: userName,
          email: currentUser.email,
          role: 'admin',
          joinedAt: new Date().toISOString()
        }],
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'families', familyId), familyData);
      
      // Update user to admin with new familyId and name
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: userName,
        role: 'admin',
        familyId: familyId
      });
      
      setMessage({ type: 'success', text: `Family "${familyName}" created with code: ${familyCode.toUpperCase()}` });
      setShowCreateFamily(false);
      
      // Refresh page to update user profile
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setCreatingFamily(false);
    }
  };

  const handleUpdateFamilyCode = async () => {
    if (!newFamilyCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a family code' });
      return;
    }

    if (newFamilyCode.length < 4 || newFamilyCode.length > 10) {
      setMessage({ type: 'error', text: 'Family code must be 4-10 characters' });
      return;
    }

    try {
      setUpdatingCode(true);
      
      // Check if new code already exists
      const existingFamily = await getFamilyByCode(newFamilyCode.toUpperCase());
      if (existingFamily && existingFamily.familyId !== familyData.familyId) {
        setMessage({ type: 'error', text: 'Family code already exists. Please choose another.' });
        return;
      }
      
      // Update family code using setDoc with merge
      console.log('Updating family:', familyData.familyId, 'with code:', newFamilyCode.toUpperCase());
      await setDoc(doc(db, 'families', familyData.familyId), {
        ...familyData,
        familyCode: newFamilyCode.toUpperCase()
      }, { merge: true });
      console.log('Family code updated successfully');
      
      setMessage({ type: 'success', text: `Family code updated to: ${newFamilyCode.toUpperCase()}` });
      setEditingCode(false);
      setNewFamilyCode('');
      
      // Refresh family data
      await fetchFamilyData();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdatingCode(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Create or update user document
      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        name: name,
        email: currentUser.email,
        role: userProfile?.role || 'member',
        familyId: userProfile?.familyId || `family_${currentUser.uid}`,
        linkedDrive: userProfile?.linkedDrive || 'drive_account_1',
        createdAt: userProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="input-field bg-gray-50 cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Account Information */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-700">Account Role</p>
                  <p className="text-sm text-gray-500">Your access level in the system</p>
                </div>
                <div className="badge badge-primary capitalize">
                  {userProfile?.role || 'Member'}
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-700">User ID</p>
                  <p className="text-sm text-gray-500">Your unique identifier</p>
                </div>
                <p className="text-sm text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded">
                  {currentUser?.uid?.substring(0, 12)}...
                </p>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-700">Family ID</p>
                  <p className="text-sm text-gray-500">Your family group identifier</p>
                </div>
                <p className="text-sm text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded">
                  {userProfile?.familyId?.substring(0, 16)}...
                </p>
              </div>

              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Linked Drive Account</p>
                  <p className="text-sm text-gray-500">Google Drive storage account</p>
                </div>
                <p className="text-sm text-gray-900">
                  {userProfile?.linkedDrive || 'Not linked'}
                </p>
              </div>
            </div>
          </div>

          {/* Create Family (for users without proper family setup) */}
          {userProfile?.role !== 'admin' && !familyData && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Create Your Family</h2>
              </div>
              
              {!showCreateFamily ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    You don't have a family set up yet. Create one to start managing documents.
                  </p>
                  <button
                    onClick={() => setShowCreateFamily(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Create Family
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Family Name
                    </label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      className="input-field"
                      placeholder="Smith Family"
                      maxLength={30}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Family Code
                    </label>
                    <input
                      type="text"
                      value={familyCode}
                      onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                      className="input-field"
                      placeholder="SMITH2024"
                      maxLength={10}
                    />
                    <p className="text-xs text-gray-500 mt-1">4-10 characters, will be converted to uppercase</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateFamily}
                      disabled={creatingFamily}
                      className="btn-primary flex items-center gap-2"
                    >
                      {creatingFamily ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          Create Family
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateFamily(false);
                        setFamilyCode('');
                        setFamilyName('');
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Join Family (for non-admin users) */}
          {userProfile?.role !== 'admin' && familyData && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Join Family</h2>
              </div>
              
              {!showJoinFamily ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    Want to join another family? Get a family code from the family admin.
                  </p>
                  <button
                    onClick={() => setShowJoinFamily(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Join Family
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Family Code
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="input-field"
                      placeholder="SMITH2024"
                      maxLength={8}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleJoinFamily}
                      disabled={joining}
                      className="btn-primary flex items-center gap-2"
                    >
                      {joining ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                      {joining ? 'Joining...' : 'Join Family'}
                    </button>
                    <button
                      onClick={() => {
                        setShowJoinFamily(false);
                        setJoinCode('');
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Family Management */}
          {userProfile?.role === 'admin' && familyData && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Family Management</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Family Name
                  </label>
                  <p className="text-gray-900 font-medium">{familyData.familyName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Family Code
                  </label>
                  {!editingCode ? (
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-lg font-bold">
                        {familyData.familyCode}
                      </code>
                      <button
                        onClick={copyFamilyCode}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          setEditingCode(true);
                          setNewFamilyCode(familyData.familyCode);
                        }}
                        className="btn-secondary"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newFamilyCode}
                          onChange={(e) => setNewFamilyCode(e.target.value.toUpperCase())}
                          className="input-field flex-1"
                          placeholder="SMITH2024"
                          maxLength={10}
                        />
                        <button
                          onClick={handleUpdateFamilyCode}
                          disabled={updatingCode}
                          className="btn-primary flex items-center gap-2"
                        >
                          {updatingCode ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Save'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingCode(false);
                            setNewFamilyCode('');
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">4-10 characters, will be converted to uppercase</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Share this code with family members to let them join
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Family Members ({familyData.members?.length || 0})
                  </label>
                  <div className="space-y-2">
                    {familyData.members?.map((member) => (
                      <div key={member.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                        <span className="badge badge-primary capitalize">{member.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Usage Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage & Limits</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Google Drive provides 15 GB of free storage per account. 
                Multi-account rotation will be automatically managed when nearing storage limits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
