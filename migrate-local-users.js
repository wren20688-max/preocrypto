// migrate-local-users.js
// Run this in browser console or as a script in your app to sync localStorage users to backend

(async function migrateLocalUsersToBackend() {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  if (!users.length) {
    alert('No local users found in localStorage.');
    return;
  }
  let ok = 0, fail = 0;
  for (const user of users) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: user.password,
          name: user.name || user.username,
          email: user.email || '',
          country: user.country || ''
        })
      });
      if (res.ok) ok++;
      else fail++;
    } catch {
      fail++;
    }
  }
  alert(`Migration complete. Success: ${ok}, Failed: ${fail}`);
})();
