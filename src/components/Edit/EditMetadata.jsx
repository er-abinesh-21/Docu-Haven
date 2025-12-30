import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Layout/Navbar';
import MetadataForm from '../Upload/MetadataForm';
import { Save, X, Loader, AlertCircle } from 'lucide-react';

const EditMetadata = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [metadata, setMetadata] = useState({
    title: '',
    type: '',
    tags: [],
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const docRef = doc(db, 'documents', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Check permissions
          const canEdit = userProfile?.role === 'admin' || data.ownerId === currentUser.uid;
          
          if (!canEdit) {
            setError('You do not have permission to edit this document');
            setLoading(false);
            return;
          }
          
          setMetadata({
            title: data.title || '',
            type: data.type || '',
            tags: data.tags || [],
            notes: data.notes || ''
          });
        } else {
          setError('Document not found');
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, currentUser, userProfile]);

  const handleSave = async () => {
    if (!metadata.title) {
      setError('Please enter a document title');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await updateDoc(doc(db, 'documents', id), {
        title: metadata.title,
        type: metadata.type,
        tags: metadata.tags,
        notes: metadata.notes,
        updatedAt: new Date().toISOString()
      });

      navigate(`/document/${id}`);
    } catch (err) {
      console.error('Error updating document:', err);
      setError('Failed to update document. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading document...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !metadata.title) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
            <button onClick={() => navigate('/dashboard')} className="text-primary-600 hover:text-primary-700">
              Return to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Document Metadata</h1>
          <p className="text-gray-600">Update the details of your document</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="card">
          <MetadataForm metadata={metadata} setMetadata={setMetadata} />

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
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
            <button
              onClick={() => navigate(`/document/${id}`)}
              disabled={saving}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditMetadata;
