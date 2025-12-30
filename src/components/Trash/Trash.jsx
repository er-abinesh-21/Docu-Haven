import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Layout/Navbar';
import { Trash2, RotateCcw, X, Loader, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const Trash = () => {
  const { currentUser, userProfile } = useAuth();
  const [deletedDocuments, setDeletedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    
    const q = query(
      collection(db, 'documents'),
      where('isDeleted', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter based on user permissions
      const userDocs = docs.filter(doc => {
        if (userProfile?.role === 'admin') return true;
        if (doc.ownerId === currentUser.uid) return true;
        return false;
      });
      
      setDeletedDocuments(userDocs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching deleted documents:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  const handleRestore = async (docId) => {
    try {
      await updateDoc(doc(db, 'documents', docId), {
        isDeleted: false,
        deletedAt: null
      });
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
    } catch (error) {
      console.error('Error restoring document:', error);
      alert('Failed to restore document');
    }
  };

  const handlePermanentDelete = async (docId) => {
    if (!window.confirm('Are you sure? This will permanently delete the document and cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'documents', docId));
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document permanently');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedDocs.length === 0) return;
    
    try {
      await Promise.all(
        selectedDocs.map(docId =>
          updateDoc(doc(db, 'documents', docId), {
            isDeleted: false,
            deletedAt: null
          })
        )
      );
      setSelectedDocs([]);
    } catch (error) {
      console.error('Error restoring documents:', error);
      alert('Failed to restore some documents');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedDocs.length} document(s)? This cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(
        selectedDocs.map(docId => deleteDoc(doc(db, 'documents', docId)))
      );
      setSelectedDocs([]);
    } catch (error) {
      console.error('Error deleting documents:', error);
      alert('Failed to delete some documents');
    }
  };

  const toggleSelect = (docId) => {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAll = () => {
    if (selectedDocs.length === deletedDocuments.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(deletedDocuments.map(doc => doc.id));
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading trash...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trash</h1>
          <p className="text-gray-600">
            Restore or permanently delete documents ({deletedDocuments.length} item{deletedDocuments.length !== 1 ? 's' : ''})
          </p>
        </div>

        {deletedDocuments.length > 0 && (
          <div className="mb-6 card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedDocs.length === deletedDocuments.length}
                    onChange={selectAll}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All ({selectedDocs.length} selected)
                  </span>
                </label>
              </div>
              {selectedDocs.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkRestore}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore Selected
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="btn-danger flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {deletedDocuments.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Trash2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Trash is empty</h3>
            <p className="text-gray-600">Deleted documents will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deletedDocuments.map(document => (
              <div key={document.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes(document.id)}
                    onChange={() => toggleSelect(document.id)}
                    className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {document.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>Type: {document.type?.replace(/_/g, ' ') || 'N/A'}</span>
                      <span>Pages: {document.pages?.length || 0}</span>
                      {document.deletedAt && (
                        <span>Deleted: {format(new Date(document.deletedAt), 'MMM dd, yyyy')}</span>
                      )}
                    </div>
                    {document.tags && document.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {document.tags.map((tag, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(document.id)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(document.id)}
                      className="btn-danger flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Trash;
