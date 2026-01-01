// Auth guard: redirect to login.html if not authenticated
(function(){
  try {
    const hasToken = !!localStorage.getItem('preo_token');
    const hasUser = !!localStorage.getItem('preo_user');
    if (!(hasToken && hasUser)) {
      // preserve intended path for redirect after login
      const next = location.pathname + location.search + location.hash;
      localStorage.setItem('preo_next', next);
      location.replace('login.html');
    }
  } catch(e){
    // if storage inaccessible, redirect to login
    try{ location.replace('login.html'); }catch(_){}
  }
})();
