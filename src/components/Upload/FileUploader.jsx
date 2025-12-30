import { useCallback } from 'react';
import { Upload, FileText, Image } from 'lucide-react';

const FileUploader = ({ onFilesSelected }) => {
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      if (!isValidSize) {
        alert(`File "${file.name}" is too large. Maximum size is 50MB.`);
        return false;
      }
      return isValidType;
    });
    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles);
    }
  }, [onFilesSelected]);

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      if (!isValidSize) {
        alert(`File "${file.name}" is too large. Maximum size is 50MB.`);
        return false;
      }
      return isValidType;
    });
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
    >
      <input
        type="file"
        id="file-upload"
        multiple
        accept="image/*,application/pdf"
        onChange={handleFileInput}
        className="hidden"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-primary-600" />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-600">
            Upload multiple pages to Google Drive
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Image className="w-4 h-4" />
              Images
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              PDFs
            </div>
          </div>
        </div>
      </label>
    </div>
  );
};

export default FileUploader;
