const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {google} = require("googleapis");

admin.initializeApp();

// Google Drive API setup
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

// Initialize Google Drive API with service account
const getGoogleDriveClient = () => {
  // In production, store service account credentials
  // in Firebase Functions secrets
  const config = functions.config();
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.google && config.google.client_email,
      private_key: config.google && config.google.private_key &&
        config.google.private_key.replace(/\\n/g, "\n"),
    },
    scopes: SCOPES,
  });

  return google.drive({version: "v3", auth});
};

/**
 * Upload a file to Google Drive
 * Accepts: fileName, fileData (base64), mimeType, ownerId
 * Returns: fileId
 */
exports.uploadToDrive = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to upload files",
    );
  }

  const {fileName, fileData, mimeType, ownerId} = data;

  if (!fileName || !fileData || !mimeType) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: fileName, fileData, or mimeType",
    );
  }

  try {
    const drive = getGoogleDriveClient();

    // Get or create folder for this user
    const folderId = await getOrCreateUserFolder(drive, ownerId);

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, "base64");

    // Upload file to Drive
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: mimeType,
      body: require("stream").Readable.from(buffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, name, webViewLink",
    });

    // Make file accessible via link (view-only)
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return {
      fileId: response.data.id,
      fileName: response.data.name,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error("Error uploading to Drive:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to upload file to Google Drive",
        error.message,
    );
  }
});

/**
 * Delete a file from Google Drive
 */
exports.deleteFromDrive = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
    );
  }

  const {fileId} = data;

  if (!fileId) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing fileId",
    );
  }

  try {
    const drive = getGoogleDriveClient();
    await drive.files.delete({fileId});

    return {success: true, message: "File deleted successfully"};
  } catch (error) {
    console.error("Error deleting from Drive:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to delete file from Google Drive",
        error.message,
    );
  }
});

/**
 * Get or create a folder for the user
 * @param {object} drive - Google Drive client instance
 * @param {string} ownerId - User ID for folder naming
 * @return {Promise<string>} Folder ID
 */
async function getOrCreateUserFolder(drive, ownerId) {
  const folderName = `FamilyDocs_${ownerId}`;

  // Check if folder already exists
  const query = `name='${folderName}' and ` +
    `mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const response = await drive.files.list({
    q: query,
    fields: "files(id, name)",
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  // Create new folder
  const fileMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id",
  });

  return folder.data.id;
}

/**
 * Perform OCR on an image using Google Vision API (optional)
 */
exports.performOCR = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
    );
  }

  const {fileId} = data;

  if (!fileId) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing fileId",
    );
  }

  // This is a placeholder for OCR implementation
  // In production, you would use Google Vision API
  return {
    success: true,
    ocrText: "OCR feature coming soon",
  };
});

/**
 * Check Drive storage usage and rotate accounts if needed
 */
exports.checkStorageUsage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
    );
  }

  try {
    const drive = getGoogleDriveClient();

    const about = await drive.about.get({
      fields: "storageQuota",
    });

    const quota = about.data.storageQuota;
    const usedSpace = parseInt(quota.usage || 0);
    const totalSpace = parseInt(quota.limit || 16106127360); // 15 GB default
    const percentageUsed = (usedSpace / totalSpace) * 100;

    return {
      usedSpace,
      totalSpace,
      percentageUsed: percentageUsed.toFixed(2),
      needsRotation: percentageUsed > 90,
    };
  } catch (error) {
    console.error("Error checking storage:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to check storage usage",
        error.message,
    );
  }
});

/**
 * Cleanup function - delete files from Drive
 * when document is permanently deleted
 */
exports.cleanupDeletedDocument = functions.firestore
    .document("documents/{documentId}")
    .onDelete(async (snap, context) => {
      const document = snap.data();

      if (!document.pages || document.pages.length === 0) {
        return;
      }

      try {
        const drive = getGoogleDriveClient();

        // Delete all page files
        for (const page of document.pages) {
          if (page.fileId) {
            try {
              await drive.files.delete({fileId: page.fileId});
              console.log(`Deleted file ${page.fileId}`);
            } catch (error) {
              console.error(`Error deleting file ${page.fileId}:`, error);
            }
          }
        }

        // Delete merged PDF if exists
        if (document.pdfFileId) {
          try {
            await drive.files.delete({fileId: document.pdfFileId});
            console.log(`Deleted PDF ${document.pdfFileId}`);
          } catch (error) {
            console.error(`Error deleting PDF ${document.pdfFileId}:`, error);
          }
        }

        const docId = context.params.documentId;
        console.log(`Cleanup completed for document ${docId}`);
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    });
