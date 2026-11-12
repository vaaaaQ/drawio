/**
 * dm/bridge.js: the bridge between draw.io in embed mode and the designer of ws-design-module (vaaaaQ/drawio, branch
 * dm; drawio-poc.md §7). The documented embed protocol (load, merge, autosave, export) has no selection event; the bridge
 * adds, as JSON messages prefixed dm- and only with the page that framed the editor on the same origin:
 *   event  dm-ready                      the bridge is installed
 *   event  dm-select {keys, refs, ids, nodes}  the selection changed: keys of designer nodes ("dm:<key>"), their
 *                                        model refs, all cell ids, and per key {label, use, ref}
 *   action dm-select {keys}              select these designer nodes and scroll to them
 *   action dm-highlight {keys, ms}       outline these nodes for a while (impact, proposals)
 *   action dm-fit                        fit the diagram into the window
 *   action dm-reveal {keys}              if these nodes are not all in view, fit the diagram (never zooming in)
 *   event  dm-edit {editing}             a label is being typed (the designer holds a patch back until it ends)
 *   event  dm-key {down}                 push-to-talk (Ctrl+Space) pressed or released inside the editor
 * Apache-2.0, like draw.io.
 */
(function()
{
	if (window.parent == null || window.parent === window)
	{
		return;
	}

	var target = window.location.origin;
	var installed = false;

	function post(msg)
	{
		try
		{
			window.parent.postMessage(JSON.stringify(msg), target);
		}
		catch (e)
		{
			// the parent is gone
		}
	}

	function keyOf(cell)
	{
		var id = (cell != null) ? String(cell.id) : '';

		return (id.substring(0, 3) == 'dm:' && id.substring(0, 5) != 'dm:e:') ? id.substring(3) : null;
	}

	function install(ui)
	{
		if (installed || ui == null || ui.editor == null)
		{
			return;
		}

		installed = true;
		var graph = ui.editor.graph;
		window.dmBridgeUi = ui;

		graph.getSelectionModel().addListener(mxEvent.CHANGE, function()
		{
			var cells = graph.getSelectionCells();
			var keys = [], refs = [], ids = [], nodes = {};

			for (var i = 0; i < cells.length; i++)
			{
				var k = keyOf(cells[i]);
				ids.push(String(cells[i].id));

				if (k != null)
				{
					keys.push(k);
					var v = cells[i].value;
					var obj = v != null && typeof v === 'object' && v.getAttribute != null;
					// the label as plain text (html=1 labels carry markup; DOMParser runs no script)
					var html = String(graph.convertValueToString(cells[i]) || '').replace(/<br\s*\/?>/gi, '\n');
					var text = new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
					nodes[k] = {label: String(text).split('\n')[0].trim(),
						use: obj ? v.getAttribute('dm_use') : null,
						ref: obj ? v.getAttribute('dm_ref') : null};

					if (obj && v.getAttribute('dm_ref'))
					{
						refs.push(v.getAttribute('dm_ref'));
					}
				}
			}

			post({event: 'dm-select', keys: keys, refs: refs, ids: ids, nodes: nodes});
		});

		graph.addListener(mxEvent.EDITING_STARTED, function()
		{
			post({event: 'dm-edit', editing: true});
		});

		graph.addListener(mxEvent.EDITING_STOPPED, function()
		{
			post({event: 'dm-edit', editing: false});
		});

		var highlights = [];

		function clearHighlights()
		{
			for (var i = 0; i < highlights.length; i++)
			{
				highlights[i].destroy();
			}

			highlights = [];
		}

		window.addEventListener('message', function(evt)
		{
			if (evt.source !== window.parent || evt.origin !== target || typeof evt.data !== 'string')
			{
				return;
			}

			var msg = null;

			try
			{
				msg = JSON.parse(evt.data);
			}
			catch (e)
			{
				return;
			}

			if (msg == null || typeof msg.action !== 'string' || msg.action.substring(0, 3) != 'dm-')
			{
				return;
			}

			var model = graph.getModel();
			var cells = [];

			for (var i = 0; msg.keys != null && i < msg.keys.length; i++)
			{
				var c = model.getCell('dm:' + msg.keys[i]);

				if (c != null)
				{
					cells.push(c);
				}
			}

			if (msg.action == 'dm-fit')
			{
				var b = graph.getGraphBounds();

				if (b.width > 0 && b.height > 0)
				{
					graph.fit(24);

					if (graph.view.scale > 1)
					{
						graph.zoomTo(1);
					}

					graph.center(true, true);
				}
			}
			else if (msg.action == 'dm-reveal')
			{
				var c = graph.container, t = graph.view.translate, sc = graph.view.scale, out = false;

				for (var r = 0; r < cells.length; r++)
				{
					var st = graph.view.getState(cells[r]);

					if (st != null && (st.x < c.scrollLeft || st.y < c.scrollTop ||
						st.x + st.width > c.scrollLeft + c.clientWidth || st.y + st.height > c.scrollTop + c.clientHeight))
					{
						out = true;
					}
				}

				if (out)
				{
					var before = sc;
					graph.fit(24);

					if (graph.view.scale > before)
					{
						graph.zoomTo(before);
					}

					graph.center(true, true);
				}

				void t;
			}
			else if (msg.action == 'dm-select')
			{
				graph.setSelectionCells(cells);

				if (cells.length > 0)
				{
					graph.scrollCellToVisible(cells[0]);
				}
			}
			else if (msg.action == 'dm-highlight')
			{
				clearHighlights();

				for (var j = 0; j < cells.length; j++)
				{
					var hl = new mxCellHighlight(graph, msg.color || '#f59e0b', 4);
					hl.highlight(graph.view.getState(cells[j]));
					highlights.push(hl);
				}

				if (cells.length > 0)
				{
					window.setTimeout(clearHighlights, msg.ms || 4000);
				}
			}
		});

		function onKey(down)
		{
			return function(evt)
			{
				if ((evt.code == 'Space' || evt.keyCode == 32) && (evt.ctrlKey || !down) && !graph.isEditing())
				{
					if (down && !evt.repeat)
					{
						post({event: 'dm-key', down: true});
					}
					else if (!down)
					{
						post({event: 'dm-key', down: false});
					}

					if (evt.ctrlKey)
					{
						mxEvent.consume(evt);
					}
				}
			};
		}

		document.addEventListener('keydown', onKey(true), true);
		document.addEventListener('keyup', onKey(false), true);
		post({event: 'dm-ready'});
	}

	// draw.io's plugin entry point gives the EditorUi; when the app is already running, App.DrawPlugins was processed
	// before this script loaded, so the bridge also waits for the editor the embed init made (EditorUi has a static list)
	if (window.Draw != null && typeof window.Draw.loadPlugin === 'function')
	{
		window.Draw.loadPlugin(install);
	}

	var tries = 0;
	var timer = window.setInterval(function()
	{
		var ui = (window.EditorUi != null && EditorUi.instances != null && EditorUi.instances.length > 0) ?
			EditorUi.instances[EditorUi.instances.length - 1] : null;

		if (ui == null && window.Draw != null && typeof window.Draw.loadPlugin === 'function' && tries == 0)
		{
			window.Draw.loadPlugin(install);
		}

		if (ui != null)
		{
			install(ui);
		}

		if (installed || ++tries > 600)
		{
			window.clearInterval(timer);
		}
	}, 100);
})();
