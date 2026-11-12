/**
 * Copyright (c) 2006-2024, JGraph Holdings Ltd
 * Copyright (c) 2006-2024, draw.io AG
 */
// null'ing of global vars need to be after init.js
window.ICONSEARCH_PATH = null;
window.ICON_SERVICE_PATH = null;
// dm (vaaaaQ/drawio): no logging host either, and the bridge to the designer (dm/bridge.js)
window.DRAWIO_LOG_URL = null;
(function()
{
	var s = document.createElement('script');
	s.src = 'dm/bridge.js';
	document.getElementsByTagName('head')[0].appendChild(s);
})();
