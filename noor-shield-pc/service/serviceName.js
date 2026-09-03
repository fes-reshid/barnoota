'use strict';

/**
 * Single source of truth for how the service identifies itself, so
 * install.js, uninstall.js, and anything checking service status via `sc
 * query` all agree. node-windows derives its internal "id" from the display
 * name the same way (strip non-word characters, lowercase) — computed here
 * explicitly rather than re-deriving it, so a node-windows version change
 * can't silently disagree with us.
 */
const DISPLAY_NAME = 'Noor Shield Filter';
const SERVICE_ID = DISPLAY_NAME.replace(/[^\w]/gi, '').toLowerCase(); // "noorshieldfilter"
const DESCRIPTION =
  'Blocks known adult-content domains for this PC. Runs independently of the ' +
  'Noor Shield app window, so protection stays on whether or not anyone is signed in.';

module.exports = { DISPLAY_NAME, SERVICE_ID, DESCRIPTION };
