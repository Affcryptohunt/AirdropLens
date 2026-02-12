import React from 'react';

/**
 * SybilGuide component – optional standalone guide.
 * The main Sybil guide UI is currently inline in App.jsx (showGuide modal).
 */
export default function SybilGuide() {
  return (
    <div className="p-4 text-zinc-400 text-sm">
      Use the &quot;Fix Sybil Score&quot; button in the scan results to open the guide.
    </div>
  );
}
