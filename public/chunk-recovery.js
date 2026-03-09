(function() {
  var reloadCount = 0;
  try { reloadCount = parseInt(sessionStorage.getItem('_cr') || '0', 10); } catch(e) {}

  if (reloadCount > 3) {
    try { sessionStorage.removeItem('_cr'); } catch(e) {}
    return;
  }

  var reloading = false;

  function doReload() {
    if (reloading) return;
    reloading = true;
    try { sessionStorage.setItem('_cr', String(reloadCount + 1)); } catch(e) {}
    setTimeout(function() { window.location.reload(); }, 1200);
  }

  function isChunkError(msg) {
    return typeof msg === 'string' && (
      msg.indexOf('Loading chunk') !== -1 ||
      msg.indexOf('ChunkLoadError') !== -1 ||
      msg.indexOf('Failed to fetch dynamically imported module') !== -1 ||
      msg.indexOf('loading CSS chunk') !== -1
    );
  }

  var origError = window.onerror;
  window.onerror = function(msg) {
    if (isChunkError(String(msg))) { doReload(); return true; }
    if (origError) return origError.apply(this, arguments);
  };

  window.addEventListener('unhandledrejection', function(e) {
    var msg = e && e.reason && (e.reason.message || String(e.reason)) || '';
    if (isChunkError(msg)) { doReload(); }
  });

  setTimeout(function() {
    try { sessionStorage.removeItem('_cr'); } catch(e) {}
  }, 10000);
})();
