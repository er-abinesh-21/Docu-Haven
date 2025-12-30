import { Link, useNavigate } from 'react-router-dom';
import { FileText, Image, Eye, Edit, Trash2, Calendar, Tag, FolderOpen, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';

const DocumentCard = ({ document }) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [folders, setFolders] = useState([]);
  const isPDF = document.pdfFileId || document.pages?.some(p => p.fileId?.endsWith('.pdf'));
  
  const getThumbnail = () => {
    if (document.pages && document.pages.length > 0) {
      const firstPage = document.pages[0];
      // Prioritize base64 data for reliable preview
      if (firstPage.fileData && firstPage.fileData.startsWith('data:')) {
        return firstPage.fileData;
      }
      // Only use Google Drive if fileId doesn't start with 'temp_'
      if (firstPage.fileId && !firstPage.fileId.startsWith('temp_')) {
        return `https://drive.google.com/uc?export=view&id=${firstPage.fileId}`;
      }
      return firstPage.downloadLink || null;
    }
    return null;
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await updateDoc(doc(db, 'documents', document.id), {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  useEffect(() => {
    if (userProfile?.familyId) {
      const foldersQuery = query(
        collection(db, 'folders'),
        where('familyId', '==', userProfile.familyId),
        where('isDeleted', '==', false)
      );
      
      const unsubscribe = onSnapshot(foldersQuery, (snapshot) => {
        const folderList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFolders(folderList);
      });
      
      return () => unsubscribe();
    }
  }, [userProfile]);

  const handleMoveToFolder = async (folderId) => {
    try {
      await updateDoc(doc(db, 'documents', document.id), {
        folderId: folderId || null
      });
      setShowMoveModal(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Error moving document:', error);
    }
  };

  const canEdit = userProfile?.role === 'admin' || document.ownerId === userProfile?.uid;
  const canDelete = userProfile?.role === 'admin' || document.ownerId === userProfile?.uid;

  return (
    <div className="card hover:shadow-lg transition-shadow relative">
      {/* Menu Button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-2 bg-white shadow-md hover:shadow-lg rounded-full border"
        >
          <MoreVertical className="w-4 h-4 text-gray-700" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-50 min-w-40">
            <button
              onClick={() => {
                setShowMoveModal(true);
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              Move to Folder
            </button>
            {canEdit && (
              <button
                onClick={() => navigate(`/edit/${document.id}`)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      <Link to={`/document/${document.id}`} className="block">
        {/* Thumbnail */}
      <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 h-48 flex items-center justify-center">
        {getThumbnail() ? (
          <img 
            src={getThumbnail()} 
            alt={document.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.warn('Thumbnail failed to load for:', document.title);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="flex flex-col items-center justify-center w-full h-full" style={{ display: getThumbnail() ? 'none' : 'flex' }}>
          {isPDF ? (
            <FileText className="w-16 h-16 text-gray-400" />
          ) : (
            <Image className="w-16 h-16 text-gray-400" />
          )}
          <p className="text-sm text-gray-500 mt-2">No preview</p>
        </div>
      </div>

      {/* Document Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {document.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            {document.createdAt ? format(new Date(document.createdAt), 'MMM dd, yyyy') : 'N/A'}
          </div>
        </div>

        {/* Type Badge */}
        {document.type && (
          <div className="badge badge-primary">
            {document.type.replace(/_/g, ' ')}
          </div>
        )}

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {document.tags.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{document.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Page Count */}
        {document.pages && (
          <div className="text-sm text-gray-600">
            {document.pages.length} page{document.pages.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">
            <Eye className="w-4 h-4" />
            View
          </div>
        </div>
      </div>

    </Link>

      {/* Move to Folder Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Move "{document.title}" to folder</h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => handleMoveToFolder(null)}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Root (No folder)
              </button>
              
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleMoveToFolder(folder.id)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  {folder.name}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowMoveModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentCard;
