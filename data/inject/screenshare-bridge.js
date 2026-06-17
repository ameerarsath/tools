(function() {
  let port = document.querySelector('span[data-xp-a]');
  if (!port) {
    port = document.createElement('span');
    port.setAttribute('data-xp-a', '1');
    port.style.display = 'none';
    document.documentElement.append(port);
  }

  const sync = () => chrome.storage.local.get({
    accessToken: '',
    loggedIn: false,
    isPro: false
  }, prefs => {
    port.dataset.t = prefs.accessToken || '';
    port.dataset.li = prefs.loggedIn ? 'true' : 'false';
    port.dataset.pr = prefs.isPro ? 'true' : 'false';
  });

  sync();
  chrome.storage.onChanged.addListener(sync);

  const observer = new MutationObserver(() => {
    if (port.dataset.ol === 'true') {
      port.dataset.ol = 'false';
      try {
        chrome.runtime.sendMessage({ action: 'showLoginPrompt' });
      } catch (err) {}
    }
  });
  observer.observe(port, { attributes: true, attributeFilter: ['data-ol'] });
})();
