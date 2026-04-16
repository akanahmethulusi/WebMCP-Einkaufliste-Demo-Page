# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebMCP is a demo project showcasing Web Model Context Protocol integration — web apps that expose tools to AI agents via `navigator.modelContext`. Built with vanilla HTML/CSS/JavaScript (no build system, no npm).

## Running the Project

```bash
# Python 3
python3 -m http.server 8000

# OR Node.js
npx http-server .
```

Navigate to `http://localhost:8000`. A local HTTP server is required (file:// URLs won't work — WebMCP needs secure context).

## Architecture

### Applications

- **Landing Page** (`index.html`) — Menu page linking to all demos.

- **Shopping List / Super App** (`markt.html` + `marktscript.js` + `marktstyle.css`) — Multi-store shopping list aggregating iframed sub-apps (`markts/markt1-3.html`). Exposes `add_item`, `move_item`, `remove_item`, `update_item`, `get_markt_state` tools.

### Key Patterns

**WebMCP Tool Registration:**
```javascript
navigator.modelContext.registerTool({
    name: 'tool_name',
    description: '...',
    inputSchema: { type: 'object', properties: {...}, required: [...] },
    execute: async (args) => ({ content: [{ type: 'text', text: '...' }] })
});
```

**Polyfill Fallback:** Apps load `@mcp-b/global` from unpkg and create a mock `navigator.modelContext` when unavailable, enabling graceful degradation.

**Super App iframe Communication:** `markt.html` aggregates child app tools via `postMessage`. Flow: child sends `WEBMCP_REGISTER_TOOL` → parent registers proxy tool → agent calls tool → parent forwards via `WEBMCP_EXECUTE_TOOL` → child returns `WEBMCP_TOOL_RESULT`.

**Declarative API** (`declarative-polyfill.js`): Converts `<form>` elements with `toolname` attributes into WebMCP tools automatically, generating `inputSchema` from form inputs.

**Render Pattern:** Single `renderBoard()` / `renderMarkt()` function clears and re-populates DOM after every state mutation.

### State Management

Both apps use a simple in-memory `state` object (tasks array or items array) with no persistence. All mutations go through named functions that update state then call render.

### Styling

- Markt: Light brutalist theme with per-store color coding (red/teal/purple)

### Security

`escapeHtml()` utility prevents XSS — user input is never passed to innerHTML directly.
