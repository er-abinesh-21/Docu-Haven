import { useState, useEffect } from 'react';
import { X, GripVertical, ChevronUp, ChevronDown, FileText, Image } from 'lucide-react';

const PagePreview = ({ file, index, onRemove, onReorder, totalPages }) => {
  const [preview, setPreview] = useState(null);
  const isPDF = file.type === 'application/pdf';

  useEffect(() => {
    if (!isPDF) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, [file, isPDF]);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex flex-col gap-1">
        <button
          onClick={() => index > 0 && onReorder(index, index - 1)}
          disabled={index === 0}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => index < totalPages - 1 && onReorder(index, index + 1)}
          disabled={index === totalPages - 1}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
        {preview ? (
          <img src={preview} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <FileText className="w-8 h-8 text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          Page {index + 1}: {file.name}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(file.size)} • {isPDF ? 'PDF' : 'Image'}
        </p>
      </div>

      <button
        onClick={() => onRemove(index)}
        className="p-2 hover:bg-red-50 rounded text-red-600 hover:text-red-700 flex-shrink-0"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default PagePreview;
