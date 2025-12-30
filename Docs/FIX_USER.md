# 🔧 Fix Your User Account

Your current user needs to be updated to admin role and get a family. Here's how to fix it:

## Option 1: Quick Fix via Browser Console

1. **Go to your Dashboard**
2. **Open browser console (F12)**
3. **Paste this code and press Enter:**

```javascript
// Fix user account
const fixUser = async () => {
  const user = firebase.auth().currentUser;
  if (!user) return alert('Not logged in');
  
  const familyId = `family_${user.uid}`;
  const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Update user to admin
  await firebase.firestore().doc(`users/${user.uid}`).update({
    role: 'admin',
    familyId: familyId,
    name: 'Abi Babupoorani' // Your actual name
  });
  
  // Create family document
  await firebase.firestore().doc(`families/${familyId}`).set({
    familyId: familyId,
    familyName: "Abi's Family",
    familyCode: familyCode,
    adminId: user.uid,
    members: [{
      uid: user.uid,
      name: 'Abi Babupoorani',
      email: user.email,
      role: 'admin',
      joinedAt: new Date().toISOString()
    }],
    createdAt: new Date().toISOString()
  });
  
  alert(`Fixed! Your family code is: ${familyCode}`);
  window.location.reload();
};

fixUser();
```

## Option 2: Re-register

1. **Logout**
2. **Register again with same email** (it will update existing user)
3. **Don't check "Join existing family"**
4. **Complete registration**

## Expected Result:
- ✅ Role: Admin
- ✅ Family code appears in Settings
- ✅ Name shows properly
- ✅ Can invite family members

Try Option 1 first - it's faster! 🚀