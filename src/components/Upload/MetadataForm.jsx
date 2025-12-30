import { useState } from 'react';
import { Tag, X } from 'lucide-react';

const DOCUMENT_TYPES = [
  { value: 'aadhar', label: 'Aadhar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'medical_record', label: 'Medical Record' },
  { value: 'education', label: 'Education Certificate' },
  { value: 'property', label: 'Property Document' },
  { value: 'insurance', label: 'Insurance Document' },
  { value: 'bank', label: 'Bank Document' },
  { value: 'bill', label: 'Bill/Invoice' },
  { value: 'other', label: 'Other' }
];

const MetadataForm = ({ metadata, setMetadata }) => {
  const [tagInput, setTagInput] = useState('');

  const handleChange = (field, value) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Title *
        </label>
        <input
          type="text"
          value={metadata.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="input-field"
          placeholder="e.g., Abinesh Birth Certificate"
          required
        />
      </div>

      {/* Document Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type
        </label>
        <select
          value={metadata.type}
          onChange={(e) => handleChange('type', e.target.value)}
          className="input-field"
        >
          <option value="">Select type...</option>
          {DOCUMENT_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagKeyPress}
            className="input-field flex-1"
            placeholder="Add a tag..."
          />
          <button
            type="button"
            onClick={addTag}
            className="btn-secondary flex items-center gap-2"
          >
            <Tag className="w-4 h-4" />
            Add
          </button>
        </div>
        {metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metadata.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-primary-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={metadata.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="input-field resize-none"
          rows="4"
          placeholder="Add any additional notes about this document..."
        />
      </div>
    </div>
  );
};

export default MetadataForm;
