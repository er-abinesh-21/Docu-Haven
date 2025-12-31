import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { HardDrive, AlertCircle } from 'lucide-react';

const StorageBar = () => {
    const [storageData, setStorageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStorageData();
    }, []);

    const fetchStorageData = async () => {
        try {
            setLoading(true);
            setError(null);

            const functions = getFunctions();
            const checkStorage = httpsCallable(functions, 'checkStorageUsage');
            const result = await checkStorage();

            setStorageData(result.data);
        } catch (err) {
            console.error('Error fetching storage data:', err);
            setError('Unable to load storage data');
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 GB';
        const gb = bytes / (1024 ** 3);
        return `${gb.toFixed(2)} GB`;
    };

    const getStorageColor = (percentage) => {
        if (percentage >= 85) return 'bg-red-500';
        if (percentage >= 60) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStorageTextColor = (percentage) => {
        if (percentage >= 85) return 'text-red-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-green-600';
    };

    const getStorageGradient = (percentage) => {
        if (percentage >= 85) return 'from-red-500 to-red-600';
        if (percentage >= 60) return 'from-yellow-500 to-yellow-600';
        return 'from-green-500 to-green-600';
    };

    if (loading) {
        return (
            <div className="px-4 py-3 border-t border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded-full animate-pulse mb-2"></div>
                            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        // Gracefully hide the storage bar if the Cloud Function isn't available
        // This prevents showing errors when functions aren't deployed yet
        console.warn('Storage data unavailable:', error);
        return null;
    }

    if (!storageData) return null;

    const percentage = parseFloat(storageData.percentageUsed) || 0;
    const usedSpace = formatBytes(storageData.usedSpace);
    const totalSpace = formatBytes(storageData.totalSpace);

    return (
        <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    {/* Storage Icon */}
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getStorageGradient(percentage)} flex items-center justify-center shadow-sm`}>
                        <HardDrive className="w-5 h-5 text-white" />
                    </div>

                    {/* Storage Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-700">
                                Document Storage
                            </span>
                            <span className={`text-xs font-bold ${getStorageTextColor(percentage)}`}>
                                {percentage.toFixed(1)}%
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div
                                className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getStorageGradient(percentage)} rounded-full transition-all duration-700 ease-out shadow-sm`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                            >
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
                            </div>
                        </div>

                        {/* Storage Details */}
                        <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                                <span className="font-semibold text-gray-700">{usedSpace}</span> of {totalSpace} used
                            </span>
                            {storageData.needsRotation && (
                                <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Near limit
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StorageBar;
