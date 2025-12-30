import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { uploadToGoogleDrive, signInToGoogleDrive } from '../../utils/driveUpload';
import { mergePagesToPDF } from '../../utils/pdfMerger';
import Navbar from '../Layout/Navbar';
import FileUploader from './FileUploader';
import MetadataForm from './MetadataForm';
import PagePreview from './PagePreview';
import { Upload as UploadIcon, Save, X, AlertCircle, FileText } from 'lucide-react';

const Upload = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState({
    title: '',
    type: '',
    tags: [],
    notes: ''
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [driveToken, setDriveToken] = useState(null);
  const [createPDF, setCreatePDF] = useState(true);

  const handleFilesSelected = (selectedFiles) => {
    setFiles(selectedFiles);
    // Auto-generate title if not set
    if (!metadata.title && selectedFiles.length > 0) {
      const firstFileName = selectedFiles[0].name.replace(/\.[^/.]+$/, '');
      setMetadata(prev => ({ ...prev, title: firstFileName }));
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const reorderFiles = (fromIndex, toIndex) => {
    const newFiles = [...files];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setFiles(newFiles);
  };

  const createThumbnail = (file, maxWidth = 300) => {
    return new Promise((resolve) => {
      if (file.type === 'application/pdf') {
        resolve(null);
        return;
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      const reader = new FileReader();
      reader.onload = (e) => img.src = e.target.result;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    if (!metadata.title) {
      setError('Please enter a document title');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setProgress(0);

      // Get Google Drive access token
      let token = driveToken;
      if (!token) {
        try {
          token = await signInToGoogleDrive();
          setDriveToken(token);
        } catch (err) {
          throw new Error('Please sign in to Google Drive to upload files');
        }
      }

      // Upload files to Google Drive
      const uploadedPages = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(Math.round(((i + 1) / files.length) * 90));

        // Create thumbnail for preview
        const thumbnailData = await createThumbnail(file, 300);

        try {
          // Upload original file to Google Drive
          const result = await uploadToGoogleDrive(file, token, []);

          uploadedPages.push({
            fileName: file.name,
            fileId: result.fileId,
            downloadLink: result.downloadLink,
            fileData: thumbnailData, // Store small thumbnail for preview
            pageNumber: i + 1,
            side: files.length === 2 && i === 0 ? 'front' : files.length === 2 && i === 1 ? 'back' : null
          });
        } catch (driveError) {
          console.error('Google Drive upload failed:', driveError);
          throw new Error(`Failed to upload ${file.name} to Google Drive. Please check your connection and try again.`);
        }
      }

      let pdfFileId = null;
      
      // Create merged PDF if requested and multiple pages
      if (createPDF && uploadedPages.length > 1) {
        try {
          setProgress(95);
          const { file: pdfFile } = await mergePagesToPDF(uploadedPages, metadata.title);
          const pdfResult = await uploadToGoogleDrive(pdfFile, token, []);
          pdfFileId = pdfResult.fileId;
        } catch (pdfError) {
          console.warn('PDF merge failed:', pdfError);
        }
      }

      // Create document in Firestore
      const docData = {
        title: metadata.title,
        ownerId: currentUser.uid,
        ownerName: userProfile?.name || 'Unknown',
        familyId: userProfile?.familyId,
        folderId: metadata.folderId || null,
        type: metadata.type || 'other',
        tags: metadata.tags || [],
        notes: metadata.notes || '',
        pages: uploadedPages,
        pdfFileId: pdfFileId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sharedWith: [],
        isDeleted: false
      };

      await addDoc(collection(db, 'documents'), docData);

      // Success - navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };



  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Document</h1>
          <p className="text-gray-600">
            Upload images or PDFs of your documents with metadata
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - File Upload */}
          <div>
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Files</h2>
              <FileUploader onFilesSelected={handleFilesSelected} />
              <p className="mt-4 text-sm text-gray-600">
                Supported formats: PNG, JPG, PDF (max 50MB per file)
              </p>
            </div>

            {files.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pages Preview ({files.length})
                </h2>
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <PagePreview
                      key={index}
                      file={file}
                      index={index}
                      onRemove={removeFile}
                      onReorder={reorderFiles}
                      totalPages={files.length}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Metadata */}
          <div>
            <div className="card sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Details</h2>
              <MetadataForm metadata={metadata} setMetadata={setMetadata} />
              
              {files.length > 1 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="createPDF"
                      checked={createPDF}
                      onChange={(e) => setCreatePDF(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="createPDF" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Create merged PDF from all pages
                    </label>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 ml-7">
                    Combines all pages into a single downloadable PDF file
                  </p>
                </div>
              )}

              {uploading && (
                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="text-gray-900 font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading || files.length === 0}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Document
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  disabled={uploading}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Upload;
