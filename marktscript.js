// State Management
const state = {
    items: [
        { id: '1', name: 'Milch', store: 'markt1', purchased: false },
        { id: '2', name: 'Eier', store: 'markt1', purchased: false },
        { id: '3', name: 'Brod', store: 'markt2', purchased: true },
        { id: '4', name: 'Wasser (5L)', store: 'markt3', purchased: false }
    ],
    stores: ['markt1', 'markt2', 'markt3']
};

// Super App Logic: Show Apps when Agent uses them
// Super App Logic: Show Apps when Agent uses them
window.addEventListener('toolactivated', (event) => {
    const toolName = event.detail.toolName;
    console.log("🤖 Agent activated tool:", toolName);

    if (toolName === 'markt1_search') {
        document.getElementById('frame-markt1').style.display = 'block';
    } else if (toolName === 'markt2_search') {
        document.getElementById('frame-markt2').style.display = 'block';
    } else if (toolName === 'markt3_search') {
        document.getElementById('frame-markt3').style.display = 'block';
    }
});

// Listener for child tools (Bubbling)
window.addEventListener('message', async (event) => {
    if (event.data.type === 'WEBMCP_REGISTER_TOOL') {
        const toolDef = event.data.tool;
        const sourceWindow = event.source;
        console.log(`🔌 Main App: Received tool registration for '${toolDef.name}'`);

        if (navigator.modelContext) {
            navigator.modelContext.registerTool({
                name: toolDef.name,
                description: toolDef.description,
                inputSchema: toolDef.inputSchema,
                execute: async (args) => {
                    console.log(`🔌 Main App: Proxying execution for '${toolDef.name}' to iframe.`);

                    // Manually trigger 'toolactivated' since this is a proxy tool
                    window.dispatchEvent(new CustomEvent('toolactivated', {
                        detail: { toolName: toolDef.name }
                    }));

                    // Send execute request to iframe
                    const requestId = Date.now().toString();
                    sourceWindow.postMessage({
                        type: 'WEBMCP_EXECUTE_TOOL',
                        toolName: toolDef.name,
                        args: args,
                        requestId: requestId
                    }, '*');

                    // Wait for result from iframe
                    return new Promise((resolve) => {
                        const resultHandler = (resEvent) => {
                            if (resEvent.data.type === 'WEBMCP_TOOL_RESULT' && resEvent.data.requestId === requestId) {
                                window.removeEventListener('message', resultHandler);
                                resolve(resEvent.data.result);
                                resetHideIframesTimer(); // Auto-hide 5 sec after search finishes
                            }
                        };
                        window.addEventListener('message', resultHandler);
                    });
                }
            });
        }
    }
});

// Auto-Hide Iframes after inactivity
let hideIframesTimer = null;
function resetHideIframesTimer() {
    if (hideIframesTimer) clearTimeout(hideIframesTimer);
    hideIframesTimer = setTimeout(() => {
        console.log("🙈 Hiding all iframes due to 15 seconds of inactivity...");
        document.querySelectorAll('.phone-frame').forEach(el => el.style.display = 'none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 15000); // 15 seconds timeout
}

// Initial Data
const marktData = {
    items: [
        { id: '1', name: 'Milch', store: 'markt1', purchased: false },
        { id: '2', name: 'Eier', store: 'markt1', purchased: false },
        { id: '3', name: 'Brod', store: 'markt2', purchased: true },
        { id: '4', name: 'Wasser (5L)', store: 'markt3', purchased: false }
    ],
    stores: ['markt1', 'markt2', 'markt3']
};

// DOM Elements
const columns = {
    markt1: document.getElementById('markt1-list'),
    markt2: document.getElementById('markt2-list'),
    markt3: document.getElementById('markt3-list')
};

const counts = {
    markt1: document.getElementById('markt1-count'),
    markt2: document.getElementById('markt2-count'),
    markt3: document.getElementById('markt3-count')
};

// Render Logic
function rendermarkt() {
    // Clear lists
    Object.values(columns).forEach(col => col.innerHTML = '');

    // Render Items
    state.items.forEach(item => {
        const itemEl = createItemElement(item);
        if (columns[item.store]) {
            columns[item.store].appendChild(itemEl);
        }
    });

    // Update Counts & Stats
    updateStats();
}

function updateStats() {
    state.stores.forEach(store => {
        const storeItems = state.items.filter(i => i.store === store);
        const purchasedCount = storeItems.filter(i => i.purchased).length;
        if (counts[store]) {
            counts[store].textContent = `${purchasedCount}/${storeItems.length}`;
        }
    });

    document.getElementById('total-items').textContent = `${state.items.length} ÜRÜN`;
}

function createItemElement(item) {
    const el = document.createElement('div');
    el.className = `markt-item ${item.purchased ? 'purchased' : ''}`;
    el.draggable = true;
    el.id = item.id;

    el.innerHTML = `
        <div class="custom-checkbox" onclick="togglePurchase('${item.id}')">
            <i class="fas fa-check"></i>
        </div>
        <span class="item-name">${escapeHtml(item.name)}</span>
        <div class="delete-btn" onclick="removeItem('${item.id}')">
            <i class="fas fa-times"></i>
        </div>
    `;

    // Drag Events
    el.addEventListener('dragstart', dragStart);
    el.addEventListener('dragend', dragEnd);

    return el;
}

// Actions
function addItem(name, storeName) {
    if (!name.trim()) return;
    if (!state.stores.includes(storeName)) {
        console.error("Invalid store:", storeName);
        return;
    }

    const newItem = {
        id: Date.now().toString(),
        name: name,
        store: storeName,
        purchased: false
    };

    state.items.push(newItem);
    rendermarkt();
}

function addItemFromInput(storeName) {
    const input = document.querySelector(`#${storeName} .add-item-area input`);
    addItem(input.value, storeName);
    input.value = '';
}

function handleEnter(e, storeName) {
    if (e.key === 'Enter') addItemFromInput(storeName);
}

function removeItem(id) {
    state.items = state.items.filter(i => i.id !== id);
    rendermarkt();
}

function togglePurchase(id) {
    const item = state.items.find(i => i.id === id);
    if (item) {
        item.purchased = !item.purchased;
        rendermarkt();
    }
}


function updateItem(id, newName) {
    const item = state.items.find(i => i.id === id);
    if (item) {
        item.name = newName;
        rendermarkt();
    }
}

function moveItem(itemId, targetStore) {
    const item = state.items.find(i => i.id === itemId);
    if (item && state.stores.includes(targetStore)) {
        item.store = targetStore;
        rendermarkt();
    }
}

// Drag & Drop
let draggedId = null;

function dragStart(e) {
    draggedId = this.id;
    setTimeout(() => this.classList.add('dragging'), 0);
    e.dataTransfer.setData('text/plain', this.id);
}

function dragEnd() {
    this.classList.remove('dragging');
    draggedId = null;
    document.querySelectorAll('.markt-column').forEach(c => c.classList.remove('drag-over'));
}

function allowDrop(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const column = e.target.closest('.markt-column');
    if (!column) return;

    const storeId = column.id;
    const itemId = e.dataTransfer.getData('text/plain');

    moveItem(itemId, storeId);
    column.classList.remove('drag-over');
}

// Highlight
document.querySelectorAll('.markt-column').forEach(col => {
    col.addEventListener('dragover', () => col.classList.add('drag-over'));
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
});

// Utilities
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialization
document.addEventListener('DOMContentLoaded', rendermarkt);

// --- WebMCP Integration ---
if ('modelContext' in navigator) {
    console.log("WebMCP supported, registering markt tools...");

    // Tool: add_item
    navigator.modelContext.registerTool({
        name: 'add_item',
        description: 'Add a grocery item to a specific store list',
        inputSchema: {
            type: 'object',
            properties: {
                item_name: { type: 'string', description: 'Name of the product (e.g. Milk, Bread)' },
                store_name: { type: 'string', enum: ['markt1', 'markt2', 'markt3'], description: 'Target store' }
            },
            required: ['item_name', 'store_name']
        },
        execute: async ({ item_name, store_name }) => {
            addItem(item_name, store_name);
            resetHideIframesTimer();
            return {
                content: [{ type: 'text', text: `Added "${item_name}" to ${store_name}.` }]
            };
        }
    });

    // Tool: move_item
    navigator.modelContext.registerTool({
        name: 'move_item',
        description: 'Move an item from one store to another',
        inputSchema: {
            type: 'object',
            properties: {
                item_name: { type: 'string', description: 'Name of the item to move (fuzzy match)' },
                target_store: { type: 'string', enum: ['markt1', 'markt2', 'markt3'], description: 'New store' }
            },
            required: ['item_name', 'target_store']
        },
        execute: async ({ item_name, target_store }) => {
            // Fuzzy find item by name (ignoring case)
            const item = state.items.find(i => i.name.toLowerCase().includes(item_name.toLowerCase()));

            if (!item) {
                throw new Error(`Item "${item_name}" not found in any list.`);
            }

            moveItem(item.id, target_store);
            resetHideIframesTimer();
            return {
                content: [{ type: 'text', text: `Moved "${item.name}" to ${target_store}.` }]
            };
        }
    });

    // Tool: remove_item
    navigator.modelContext.registerTool({
        name: 'remove_item',
        description: 'Remove an item from the list',
        inputSchema: {
            type: 'object',
            properties: {
                item_name: { type: 'string', description: 'Name of the item to remove' }
            },
            required: ['item_name']
        },
        execute: async ({ item_name }) => {
            const item = state.items.find(i => i.name.toLowerCase().includes(item_name.toLowerCase()));
            if (!item) {
                throw new Error(`Item "${item_name}" not found.`);
            }
            removeItem(item.id);
            resetHideIframesTimer();
            return {
                content: [{ type: 'text', text: `Removed "${item.name}" from list.` }]
            };
        }
    });

    // Tool: update_item
    navigator.modelContext.registerTool({
        name: 'update_item',
        description: 'Update the name or quantity of an existing item (e.g. "Bread" -> "2 Loaves of Bread")',
        inputSchema: {
            type: 'object',
            properties: {
                original_name: { type: 'string', description: 'Current name of the item to find (fuzzy match)' },
                new_name: { type: 'string', description: 'New full name for the item' }
            },
            required: ['original_name', 'new_name']
        },
        execute: async ({ original_name, new_name }) => {
            const item = state.items.find(i => i.name.toLowerCase().includes(original_name.toLowerCase()));
            if (!item) {
                throw new Error(`Item "${original_name}" not found.`);
            }
            updateItem(item.id, new_name);
            resetHideIframesTimer();
            return {
                content: [{ type: 'text', text: `Updated "${original_name}" to "${new_name}".` }]
            };
        }
    });

    // Tool: get_markt_state
    navigator.modelContext.registerTool({
        name: 'get_markt_state',
        description: 'Get the full state of all grocery lists. Use this to find items before moving or removing them.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(state, null, 2)
                }]
            };
        }
    });

} else {
    console.error("WebMCP not available.");
}
