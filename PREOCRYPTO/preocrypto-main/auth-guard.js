// Auth guard: redirect to login.html if not authenticated
(function(){
  try {
    const hasToken = !!localStorage.getItem('preo_token');
    const hasUser = !!localStorage.getItem('preo_user');
    
    if (!(hasToken && hasUser)) {
      // Check if we're already on login or signup page to avoid redirect loop
      const currentPage = location.pathname.split('/').pop() || 'index.html';
      if (currentPage === 'login.html' || currentPage === 'signup.html' || currentPage === 'index.html' || currentPage === 'landing.html') {
        return; // Don't redirect if already on auth page
      }
      
      // preserve intended path for redirect after login
      const next = location.pathname + location.search + location.hash;
      localStorage.setItem('preo_next', next);
      console.warn('Not authenticated, redirecting to login');
      location.replace('login.html');
    } else {
      // User is authenticated, log for debugging
      console.log('Auth check passed:', { hasToken, hasUser });
    }
  } catch(e){
    console.error('Auth guard error:', e);
    // if storage inaccessible, redirect to login
    try{ location.replace('login.html'); }catch(_){}
  }
})();
