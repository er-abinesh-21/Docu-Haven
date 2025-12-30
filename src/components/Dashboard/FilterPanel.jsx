import { X } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useEffect, useState } from 'react';

const FilterPanel = ({ filters, setFilters, documentTypes, allOwners, allTags, documents }) => {
  const [ownerNames, setOwnerNames] = useState({});

  useEffect(() => {
    const fetchOwnerNames = async () => {
      const names = {};
      for (const ownerId of allOwners) {
        if (!names[ownerId]) {
          try {
            const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', ownerId)));
            if (!userDoc.empty) {
              names[ownerId] = userDoc.docs[0].data().name;
            } else {
              names[ownerId] = 'Unknown User';
            }
          } catch (error) {
            console.error('Error fetching owner name:', error);
            names[ownerId] = 'Unknown User';
          }
        }
      }
      setOwnerNames(names);
    };

    if (allOwners.length > 0) {
      fetchOwnerNames();
    }
  }, [allOwners]);

  const handleTagToggle = (tag) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      owner: 'all',
      tags: []
    });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.owner !== 'all' || filters.tags.length > 0;

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Document Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="input-field"
          >
            <option value="all">All Types</option>
            {documentTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Owner Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Owner
          </label>
          <select
            value={filters.owner}
            onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
            className="input-field"
          >
            <option value="all">All Members</option>
            {allOwners.map(ownerId => (
              <option key={ownerId} value={ownerId}>
                {ownerNames[ownerId] || 'Loading...'}
              </option>
            ))}
          </select>
        </div>

        {/* Tags Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-300 rounded-lg">
            {allTags.length === 0 ? (
              <p className="text-sm text-gray-500">No tags available</p>
            ) : (
              allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
