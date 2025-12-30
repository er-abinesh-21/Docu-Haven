// Multi-account Google Drive upload using OAuth
export const uploadToGoogleDrive = async (file, accessToken, sharedEmails = []) => {
  const metadata = {
    name: file.name,
    mimeType: file.type
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: form
  });

  if (!response.ok) throw new Error('Upload failed');
  const data = await response.json();
  
  // Make file publicly accessible (anyone with link can view)
  await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  });

  // Share with specific family members if provided
  for (const email of sharedEmails) {
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          role: 'reader', 
          type: 'user',
          emailAddress: email
        })
      });
    } catch (err) {
      console.warn(`Failed to share with ${email}:`, err);
    }
  }

  return {
    fileId: data.id,
    downloadLink: `https://drive.google.com/uc?export=view&id=${data.id}`
  };
};

export const signInToGoogleDrive = () => {
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response) => {
        if (response.access_token) {
          resolve(response.access_token);
        } else {
          reject(new Error('Failed to get access token'));
        }
      }
    });
    client.requestAccessToken();
  });
};
