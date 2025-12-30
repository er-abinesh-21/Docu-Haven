import { useState } from 'react';
import { Folder, Edit, Trash2, MoreVertical } from 'lucide-react';
import { renameFolder, deleteFolder } from '../../utils/folderUtils';

const FolderCard = ({ folder, onFolderClick, onFolderUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const handleRename = async () => {
    if (newName.trim() && newName !== folder.name) {
      try {
        await renameFolder(folder.id, newName.trim());
        onFolderUpdate();
      } catch (error) {
        console.error('Error renaming folder:', error);
      }
    }
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete folder "${folder.name}"?`)) {
      try {
        await deleteFolder(folder.id);
        onFolderUpdate();
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
    setShowMenu(false);
  };

  return (
    <div className="card hover:shadow-lg transition-shadow relative">
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-32">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      <div 
        onClick={() => !isRenaming && onFolderClick(folder)}
        className="cursor-pointer"
      >
        <div className="flex flex-col items-center justify-center h-32 mb-4">
          <Folder className="w-16 h-16 text-blue-500 mb-2" />
          {isRenaming ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyPress={(e) => e.key === 'Enter' && handleRename()}
              className="text-center border rounded px-2 py-1 text-sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="text-sm font-medium text-gray-900 text-center">{folder.name}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderCard;