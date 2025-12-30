import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Layout/Navbar';
import ImagePreview from './ImagePreview';
import { 
  Download, Edit, Trash2, Share2, ChevronLeft, ChevronRight, 
  FileText, Calendar, User, Tag, Eye, Loader, ArrowLeft 
} from 'lucide-react';
import { format } from 'date-fns';

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const docRef = doc(db, 'documents', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Check permissions
          const hasAccess = 
            userProfile?.role === 'admin' ||
            data.ownerId === currentUser.uid ||
            data.sharedWith?.some(share => share.uid === currentUser.uid);
          
          if (!hasAccess) {
            setError('You do not have permission to view this document');
            setLoading(false);
            return;
          }
          
          setDocument({ id: docSnap.id, ...data });
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await updateDoc(doc(db, 'documents', id), {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleDownload = (pageIndex) => {
    if (document.pages && document.pages[pageIndex]) {
      const page = document.pages[pageIndex];
      const url = getImageUrl(page);
      window.open(url, '_blank');
    }
  };

  const getImageUrl = (page) => {
    // Prioritize base64 data for reliable preview
    if (page.fileData && page.fileData.startsWith('data:')) {
      return page.fileData;
    }
    // Fallback to Google Drive (may not work without auth)
    if (page.fileId) {
      return `https://drive.google.com/uc?export=view&id=${page.fileId}`;
    }
    return page.downloadLink || '';
  };

  const canEdit = userProfile?.role === 'admin' || document?.ownerId === currentUser.uid;
  const canDelete = userProfile?.role === 'admin' || document?.ownerId === currentUser.uid;

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

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
            <Link to="/dashboard" className="text-primary-600 hover:text-primary-700">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Viewer - Main Area */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Document Preview</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(currentPage)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>

              {/* Page Navigation */}
              {document.pages && document.pages.length > 1 && (
                <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="p-2 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    Page {currentPage + 1} of {document.pages.length}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(document.pages.length - 1, currentPage + 1))}
                    disabled={currentPage === document.pages.length - 1}
                    className="p-2 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Document Display */}
              <div className="bg-gray-100 rounded-lg overflow-hidden min-h-[600px]">
                {document.pages && document.pages[currentPage] ? (
                  <ImagePreview
                    src={getImageUrl(document.pages[currentPage])}
                    alt={`${document.title} - Page ${currentPage + 1}`}
                    className="min-h-[600px] max-h-[800px]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 min-h-[600px]">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-600">No pages available</p>
                  </div>
                )}
              </div>

              {/* Page Thumbnails */}
              {document.pages && document.pages.length > 1 && (
                <div className="mt-4 grid grid-cols-6 gap-2">
                  {document.pages.map((page, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        currentPage === index 
                          ? 'border-primary-600 ring-2 ring-primary-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(page)}
                        alt={`Page ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNkM5IDI2IDkgMTQgMjAgMTRTMzEgMjYgMjAgMjZaIiBmaWxsPSIjOUI5QkEwIi8+CjwvZz4KPC9zdmc+';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Metadata Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{document.title}</h2>

              <div className="space-y-4">
                {/* Document Type */}
                {document.type && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Type</label>
                    <div className="badge badge-primary">
                      {document.type.replace(/_/g, ' ')}
                    </div>
                  </div>
                )}

                {/* Owner */}
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Owner</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <User className="w-4 h-4" />
                    {document.ownerName || 'Unknown'}
                  </div>
                </div>

                {/* Created Date */}
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Created</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4" />
                    {document.createdAt ? format(new Date(document.createdAt), 'MMM dd, yyyy') : 'N/A'}
                  </div>
                </div>

                {/* Pages */}
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Pages</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <FileText className="w-4 h-4" />
                    {document.pages?.length || 0} page{document.pages?.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Tags */}
                {document.tags && document.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {document.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {document.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Notes</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {document.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  {document.pdfFileId && (
                    <button
                      onClick={() => window.open(`https://drive.google.com/uc?export=download&id=${document.pdfFileId}`, '_blank')}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Download PDF
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(currentPage)}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View in Drive
                  </button>
                  {canEdit && (
                    <Link
                      to={`/edit/${document.id}`}
                      className="w-full btn-secondary flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Metadata
                    </Link>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full btn-danger flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Document
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentViewer;
