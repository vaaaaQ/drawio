/**
 * Copyright (c) 2006-2024, JGraph Holdings Ltd
 * Copyright (c) 2006-2024, draw.io AG
 */
// Overrides of global vars need to be pre-loaded
window.DRAWIO_PUBLIC_BUILD = true;
window.EXPORT_URL = null; // Replace with the URL of your export server to enable server-side PDF and image export, e.g. https://www.example.com/export. With null, export to PDF uses the print dialog
// dm (vaaaaQ/drawio): this build is served by the designer of ws-design-module under <origin>/drawio/ and calls no
// diagrams.net, draw.io or jgraph service. Every absolute URL points at the origin that serves it.
(function()
{
	var base = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
	window.DRAWIO_BASE_URL = base; // was https://app.diagrams.net
	window.DRAWIO_VIEWER_URL = base + '/js/viewer.min.js';
	window.DRAWIO_LIGHTBOX_URL = base; // was https://viewer.diagrams.net
	window.GENERATE_URL = base + '/generate-disabled'; // was https://www.draw.io/generate/v3; the AI widget is off (enableAi: false)
	window.RT_WEBSOCKET_URL = (window.location.protocol == 'https:' ? 'wss://' : 'ws://') + window.location.host + '/drawio-rt-disabled';
})();
window.DRAW_MATH_URL = 'math4/es5';
// The designer sends the rest of the configuration in embed mode (configure=1): our library, enableAi: false
window.DRAWIO_CONFIG = {enableAi: false};
urlParams['sync'] = 'manual';
