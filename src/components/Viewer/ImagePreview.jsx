import { useState } from 'react';
import { FileText, AlertCircle } from 'lucide-react';

const ImagePreview = ({ src, alt, className, onError }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleImageError = (e) => {
    console.error('Image failed to load:', src);
    setImageError(true);
    setLoading(false);
    if (onError) onError(e);
  };

  const handleImageLoad = () => {
    setLoading(false);
    setImageError(false);
  };

  if (imageError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 ${className}`}>
        <FileText className="w-16 h-16 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 text-center">Preview not available</p>
        <p className="text-xs text-gray-500 text-center mt-1">Click "View in Drive" to open</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default ImagePreview;