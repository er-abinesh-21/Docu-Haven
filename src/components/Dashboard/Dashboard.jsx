import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { createFolder } from '../../utils/folderUtils';
import Navbar from '../Layout/Navbar';
import DocumentCard from './DocumentCard';
import FolderCard from './FolderCard';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import { FileText, Upload, Filter, Loader, FolderPlus, Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [filteredFolders, setFilteredFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    owner: 'all',
    tags: []
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!currentUser || !userProfile?.familyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Simple query for documents
    const docsQuery = query(
      collection(db, 'documents'),
      where('familyId', '==', userProfile.familyId),
      where('isDeleted', '==', false)
    );

    const unsubscribeDocs = onSnapshot(docsQuery, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter by current folder
      const docs = allDocs.filter(doc => {
        const docFolderId = doc.folderId || null;
        const currentFolderId = currentFolder?.id || null;
        return docFolderId === currentFolderId;
      });
      
      setDocuments(docs);
      setFilteredDocuments(docs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching documents:', error);
      setLoading(false);
    });

    // Simple query for folders
    const foldersQuery = query(
      collection(db, 'folders'),
      where('familyId', '==', userProfile.familyId),
      where('isDeleted', '==', false)
    );

    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
      const allFolders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter by parent folder
      const folders = allFolders.filter(folder => {
        const folderParentId = folder.parentId || null;
        const currentFolderId = currentFolder?.id || null;
        return folderParentId === currentFolderId;
      });
      
      setFolders(folders);
      setFilteredFolders(folders);
    }, (error) => {
      console.error('Error fetching folders:', error);
    });

    return () => {
      unsubscribeDocs();
      unsubscribeFolders();
    };
  }, [currentUser, userProfile, currentFolder]);

  useEffect(() => {
    // Apply search and filters to documents
    let filteredDocs = documents;
    let filteredFolds = folders;

    if (searchTerm) {
      filteredDocs = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        doc.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      filteredFolds = folders.filter(folder =>
        folder.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.type !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.type === filters.type);
    }

    if (filters.owner !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.ownerId === filters.owner);
    }

    if (filters.tags.length > 0) {
      filteredDocs = filteredDocs.filter(doc => 
        filters.tags.some(tag => doc.tags?.includes(tag))
      );
    }

    setFilteredDocuments(filteredDocs);
    setFilteredFolders(filteredFolds);
  }, [searchTerm, filters, documents, folders]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await createFolder(
        newFolderName.trim(),
        currentFolder?.id,
        userProfile.familyId,
        currentUser.uid,
        userProfile.name
      );
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleFolderClick = (folder) => {
    setCurrentFolder(folder);
    setFolderPath([...folderPath, folder]);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setCurrentFolder(newPath[newPath.length - 1]);
      setFolderPath(newPath);
    }
  };

  const documentTypes = [...new Set(documents.map(doc => doc.type))];
  const allOwners = [...new Set(documents.map(doc => doc.ownerId))];
  const allTags = [...new Set(documents.flatMap(doc => doc.tags || []))];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading documents...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userProfile?.name}!
          </h1>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => handleBreadcrumbClick(-1)}
              className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className="text-primary-600 hover:text-primary-700"
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
          
          <p className="text-gray-600">
            {filteredFolders.length} folder{filteredFolders.length !== 1 ? 's' : ''}, {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
            <Link to="/upload" className="btn-primary flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </Link>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            documentTypes={documentTypes}
            allOwners={allOwners}
            allTags={allTags}
            documents={documents}
          />
        )}

        {/* Create Folder Modal */}
        {showCreateFolder && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="input-field flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <button onClick={handleCreateFolder} className="btn-primary">
                Create
              </button>
              <button 
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Folders and Documents Grid */}
        {filteredFolders.length === 0 && filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-6">
              {folders.length === 0 && documents.length === 0
                ? "Get started by creating a folder or uploading a document"
                : "Try adjusting your search or filters"}
            </p>
            {folders.length === 0 && documents.length === 0 && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  Create Folder
                </button>
                <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Document
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFolders.map(folder => (
              <FolderCard 
                key={folder.id} 
                folder={folder} 
                onFolderClick={handleFolderClick}
                onFolderUpdate={() => {}} 
              />
            ))}
            {filteredDocuments.map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
