/**
 * WebMCP Declarative API Polyfill
 * 
 * This script simulates the browser's native handling of declarative WebMCP attributes.
 * It automatically discovers <form> elements with 'toolname' attributes and registers
 * them as tools with the Model Context Protocol.
 * 
 * Usages:
 * <script src="declarative-polyfill.js"></script>
 */

const CONFIG = {
    // If true, the script will try to register tools to the parent window (for iframes)
    // This allows a "Super App" to aggregate tools from sub-apps.
    BUBBLE_TO_PARENT: true
};

(function () {
    console.log("🔌 Declarative Bridge: Starting discovery...");

    // Helper to find the correct modelContext (Self or Parent)
    function getModelContext() {
        if (CONFIG.BUBBLE_TO_PARENT && window.top !== window && window.top.navigator && window.top.navigator.modelContext) {
            console.log("🔌 Declarative Bridge: Bubbling tool registration to TOP window.");
            return window.top.navigator.modelContext;
        }
        if (navigator.modelContext) {
            return navigator.modelContext;
        }
        return null; // Context not found
    }

    function initDeclarativeTools() {
        // If bubbling is enabled and we are in an iframe, send tool definition to parent via postMessage
        // This avoids complex context sharing issues with the WebMCP polyfill.
        if (CONFIG.BUBBLE_TO_PARENT && window.top !== window) {
            console.log("🔌 Declarative Bridge: Scanning for tools to bubble up...");
            const forms = document.querySelectorAll('form[toolname]');
            forms.forEach(form => {
                const toolName = form.getAttribute('toolname');
                const toolDesc = form.getAttribute('tooldescription');

                // Build Schema
                const properties = {};
                const required = [];
                form.querySelectorAll('input, select, textarea').forEach(input => {
                    const name = input.name;
                    if (!name) return;
                    properties[name] = { type: 'string', description: input.getAttribute('toolparamdescription') || `Value for ${name}` };
                    if (input.hasAttribute('required')) required.push(name);
                });

                // Send to parent
                window.top.postMessage({
                    type: 'WEBMCP_REGISTER_TOOL',
                    tool: {
                        name: toolName,
                        description: toolDesc,
                        inputSchema: { type: 'object', properties, required }
                    }
                }, '*');
                console.log(`[DeclarativePolyfill] Bubbled tool '${toolName}' to parent.`);

                // Listen for execution requests from parent
                window.addEventListener('message', async (event) => {
                    if (event.data.type === 'WEBMCP_EXECUTE_TOOL' && event.data.toolName === toolName) {
                        console.log(`[DeclarativePolyfill] Received execution request for ${toolName}`);

                        // Execute Logic (Fill form & Submit)
                        const args = event.data.args;
                        Object.entries(args).forEach(([key, value]) => {
                            const input = form.querySelector(`[name="${key}"]`);
                            if (input) input.value = value;
                        });

                        // Simulate Submit
                        const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
                        submitEvent.agentInvoked = true;

                        // Handle response
                        submitEvent.respondWith = (promise) => {
                            promise.then(data => {
                                // Send result back to parent
                                window.top.postMessage({
                                    type: 'WEBMCP_TOOL_RESULT',
                                    requestId: event.data.requestId,
                                    result: { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
                                }, '*');
                            });
                        };

                        form.dispatchEvent(submitEvent);
                    }
                });
            });
            return; // Stop here for iframes, let parent handle registration
        }

        // Standard logic for non-iframe (or parent) pages
        if (!navigator.modelContext) {
            console.warn("WebMCP global polyfill not found. Waiting...");
            setTimeout(initDeclarativeTools, 500);
            return;
        }

        const forms = document.querySelectorAll('form[toolname]');
        // ... (Existing registration logic for top-level pages) ...
        forms.forEach(form => {
            const toolName = form.getAttribute('toolname');
            const toolDesc = form.getAttribute('tooldescription');

            // Build Schema from Inputs
            const properties = {};
            const required = [];

            form.querySelectorAll('input, select, textarea').forEach(input => {
                const name = input.name;
                if (!name) return;

                properties[name] = {
                    type: 'string', // Simplified for demo
                    description: input.getAttribute('toolparamdescription') || `Value for ${name}`
                };

                if (input.hasAttribute('required')) {
                    required.push(name);
                }
            });

            console.log(`[DeclarativePolyfill] Registering tool: ${toolName}`);

            navigator.modelContext.registerTool({
                name: toolName,
                description: toolDesc,
                inputSchema: {
                    type: 'object',
                    properties: properties,
                    required: required
                },
                execute: async (args) => {
                    console.log(`[DeclarativePolyfill] Executing ${toolName} with args:`, args);

                    // 1. Fill Form
                    Object.entries(args).forEach(([key, value]) => {
                        const input = form.querySelector(`[name="${key}"]`);
                        if (input) input.value = value;
                    });

                    // 2. Simulate Submit with "agentInvoked"
                    return new Promise((resolve, reject) => {
                        let responsePromise = null;

                        const event = new Event('submit', { cancelable: true, bubbles: true });

                        // Mock WebMCP SubmitEvent extensions
                        event.agentInvoked = true;
                        event.respondWith = (promise) => {
                            responsePromise = promise;
                        };

                        form.dispatchEvent(event);

                        if (responsePromise) {
                            responsePromise.then(data => {
                                resolve({
                                    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
                                });
                            }).catch(reject);
                        } else {
                            resolve({
                                content: [{ type: 'text', text: "Form submitted (no data returned)." }]
                            });
                        }
                    });
                }
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDeclarativeTools);
    } else {
        initDeclarativeTools();
    }
})();
