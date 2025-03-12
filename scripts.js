const headerStructure = [
    { start: 0,  end: 15, name: "Header String", description: "The header string: 'SQLite format 3\\000'" },
    { start: 16, end: 17, name: "Page Size", description: "Database page size in bytes" },
    { start: 18, end: 19, name: "File Format Write Version", description: "File format write version" },
    { start: 20, end: 21, name: "File Format Read Version", description: "File format read version" },
    { start: 22, end: 23, name: "Reserved Space", description: "Bytes of reserved space at end of each page" },
    { start: 24, end: 27, name: "Maximum Embedded Payload Fraction", description: "Maximum embedded payload fraction" },
    { start: 28, end: 31, name: "Minimum Embedded Payload Fraction", description: "Minimum embedded payload fraction" },
    { start: 32, end: 35, name: "Leaf Payload Fraction", description: "Leaf payload fraction" },
    { start: 36, end: 39, name: "File Change Counter", description: "File change counter" },
    { start: 40, end: 43, name: "Database Size in Pages", description: "Size of the database file in pages" },
    { start: 44, end: 47, name: "First Freelist Page", description: "Page number of first freelist trunk page" },
    { start: 48, end: 51, name: "Freelist Page Count", description: "Number of freelist pages" },
    { start: 52, end: 55, name: "Schema Cookie", description: "Schema cookie" },
    { start: 56, end: 59, name: "Schema Format Number", description: "Schema format number" },
    { start: 60, end: 63, name: "Default Page Cache Size", description: "Default page cache size" },
    { start: 64, end: 67, name: "Largest Root B-Tree Page", description: "Page number of largest root b-tree page" },
    { start: 68, end: 71, name: "Text Encoding", description: "Database text encoding" },
    { start: 72, end: 75, name: "User Version", description: "User version" },
    { start: 76, end: 79, name: "Incremental Vacuum Mode", description: "Incremental vacuum mode" },
    { start: 80, end: 83, name: "Application ID", description: "Application ID" },
    { start: 84, end: 91, name: "Reserved", description: "Reserved for expansion" },
    { start: 92, end: 95, name: "Version Valid For", description: "The version-valid-for number" },
    { start: 96, end: 99, name: "SQLite Version", description: "SQLite version number" },
];

const pageTypes = {
    0x02: 'Index Interior',
    0x05: 'Table Interior',
    0x0a: 'Index Leaf',
    0x0d: 'Table Leaf'
};

const commonPageHeader = [
    { start: 0, end: 0, name: "Page Type", description: "Type of B-tree page" },
    { start: 1, end: 2, name: "First Freeblock", description: "Offset to first freeblock" },
    { start: 3, end: 4, name: "Cell Count", description: "Number of cells on this page" },
    { start: 5, end: 6, name: "Cell Content Offset", description: "Offset to cell content area" },
    { start: 7, end: 7, name: "Fragmented Free Bytes", description: "Number of fragmented free bytes" }
];

const tableInteriorPage = [
    ...commonPageHeader,
    { start: 8, end: 11, name: "Rightmost Pointer", description: "Right-most child pointer" }
];

// UI Elements
const fileInput = document.getElementById('file-input');
const selectButton = document.getElementById('select-button');
const hexContainer = document.getElementById('hex-container');
const dropZone = document.getElementById('drop-zone');
const loadingOverlay = document.getElementById('loading-overlay');
const resetButton = document.getElementById('reset-button');
const toggleButton = document.getElementById('toggle-button');
const contentArea = document.getElementById('content-area');
const fileMeta = document.getElementById('file-meta');
const errorMessage = document.getElementById('error-message');

let showHex = true;
let currentBytes = null;

// Handle file selection
function handleFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const bytes = new Uint8Array(e.target.result);
        hexContainer.classList.remove('hidden');
        dropZone.classList.add('hidden');
        displayHex(bytes);
    };
    reader.readAsArrayBuffer(file);
}

// Show loading state
function showLoading() {
    loadingOverlay.style.display = 'flex';
    dropZone.style.pointerEvents = 'none';
}

// Hide loading state
function hideLoading() {
    loadingOverlay.style.display = 'none';
    dropZone.style.pointerEvents = 'auto';
}

// Show error message
function showError(message) {
    document.getElementById('error-text').textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(dismissError, 5000);
}

// Dismiss error message
function dismissError() {
    errorMessage.style.display = 'none';
}

// Reset to initial state
function resetUI() {
    contentArea.classList.add('hidden');
    resetButton.classList.add('hidden');
    dropZone.classList.remove('hidden');
    fileMeta.textContent = '';
    document.getElementById('hex-container').innerHTML = '';
}

// Validate SQLite file
function validateSQLite(bytes) {
    const headerString = Array.from(bytes.slice(0, 16))
        .map(b => String.fromCharCode(b))
        .join('');
    
    return headerString === 'SQLite format 3\0';
}

// Handle file selection
async function handleFile(file) {
    try {
        showLoading();
        
        // Read file
        const arrayBuffer = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });

        const bytes = new Uint8Array(arrayBuffer);
        
        // Validate file
        if (!validateSQLite(bytes)) {
            throw new Error('Not a valid SQLite database file');
        }

        // Update UI
        hideLoading();
        dropZone.classList.add('hidden');
        contentArea.classList.remove('hidden');
        resetButton.classList.remove('hidden');
        
        // Show metadata
        fileMeta.textContent = `File: ${file.name} (${(file.size/1024).toFixed(2)} KB)`;
        
        // Display hex content
        displayHex(bytes);
    } catch (error) {
        hideLoading();
        showError(error.message);
        resetUI();
    }
}

// Event Listeners
document.getElementById('reset-button').addEventListener('click', resetUI);

// Drag and drop events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});

// Button click triggers file input
selectButton.addEventListener('click', () => fileInput.click());

// Original file input handler
fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
});

// Scroll with highlighting
function scrollToOffset(targetOffset) {
    const targetElement = document.querySelector(`[data-offset="${targetOffset}"]`);
    if (!targetElement) return;

    // Scroll to element
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight animation
    targetElement.classList.add('highlight-jump');
    setTimeout(() => {
        targetElement.classList.remove('highlight-jump');
    }, 5000);
}

function displayHex(bytes) {
    const container = document.getElementById('hex-container');
    container.innerHTML = '';
    currentBytes = bytes;

    // Parse page size from header
    const pageSize = (bytes[16] << 8) | bytes[17];

    const bytesPerRow = 16;
    const totalRows = Math.ceil(bytes.length / bytesPerRow);

    let consecutiveEmptyRows = 0;

    for (let row = 0; row < totalRows; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'hex-row';
        
        const offset = row * bytesPerRow;
        const offsetLabel = document.createElement('div');
        offsetLabel.className = 'offset-label';
        offsetLabel.textContent = offset.toString(16).padStart(4, '0').toUpperCase();
        rowDiv.appendChild(offsetLabel);

        const currentPage = Math.floor(offset / pageSize);

        // Add bytes for this row
        for (let col = 0; col < bytesPerRow; col++) {
            const byteIndex = offset + col;
            if (byteIndex >= bytes.length) break;

            const byteElement = document.createElement('div');
            byteElement.className = 'hex-byte';
            byteElement.textContent = bytes[byteIndex].toString(16).padStart(2, '0');
            byteElement.dataset.offset = byteIndex;

            // Add group highlighting on mouseover
            byteElement.addEventListener('mouseover', function(e) {
                const offset = parseInt(e.target.dataset.offset);
                let field, tooltipText;
                let pageStart = 0;

                if (offset < 100) {
                    // Header fields
                    field = headerStructure.find(f => offset >= f.start && offset <= f.end);
                } else {
                    // Page fields
                    pageStart = currentPage * pageSize + (currentPage === 0 ? 100 : 0);
                    const pageOffset = offset - pageStart;
                    const pageTypeByte = bytes[pageStart];
                    const pageType = pageTypes[pageTypeByte] || 'Unknown Page Type';
                    const isLeafPage = [0x0a, 0x0d].includes(pageTypeByte); 
                    
                    const cellCount = (bytes[pageStart + 3] << 8) | bytes[pageStart + 4];
                    const pointerArrayStart = pageStart + (isLeafPage ? 8 : 12) - pageStart;
                    const pointerArrayEnd = pointerArrayStart + (2 * cellCount) - 1;                    

                    // Get appropriate structure
                    const structure = isLeafPage ? commonPageHeader : tableInteriorPage;
                    field = structure.find(f => pageOffset >= f.start && pageOffset <= f.end);

                    if (field) {
                        tooltipText = `${pageType}<br>
                            <strong>${field.name}</strong><br>
                            Page Bytes: ${field.start === field.end ? field.start : `${field.start}-${field.end}`}<br>
                            ${field.description}`;
                    } else if (pageOffset >= pointerArrayStart && pageOffset <= pointerArrayEnd) {
                        const start = pageOffset % 2 === 0 ? pageOffset : pageOffset - 1;
                        field = { start: start, end: start + 1, description: 'Pointer Array' };

                        const pointerIndex = Math.floor((pageOffset - pointerArrayStart) / 2) + 1;
                        tooltipText = `<strong>Pointer Array</strong><br>
                            Pointer ${pointerIndex}/${cellCount}<br>
                            Bytes: ${field.start}-${field.end}`;

                        byteElement.style.cursor = 'pointer';
                    }
                }

                if (field) {
                    // Update tooltip
                    const tooltip = document.getElementById('tooltip');
                    tooltip.innerHTML = tooltipText || `<strong>${field.name}</strong><br>
                        Bytes: ${field.start}-${field.end}<br>
                        ${field.description}`;
                    tooltip.style.display = 'block';
                    
                    // Highlight group
                    const start = offset < 100 ? field.start : (pageStart + field.start);
                    const end = offset < 100 ? field.end : (pageStart + field.end);
                    
                    container.querySelectorAll('.hex-byte').forEach(el => {
                        const elOffset = parseInt(el.dataset.offset);
                        el.classList.toggle('highlight-group', elOffset >= start && elOffset <= end);
                    });

                    const firstElement = container.querySelector(`[data-offset="${start}"]`);
                    const rect = firstElement.getBoundingClientRect();
                    tooltip.style.left = `${rect.left}px`;
                    tooltip.style.top = `${rect.top - 80}px`;
                    tooltip.style.display = 'block';
                }
            });

            byteElement.addEventListener('mouseout', function() {
                // Remove all highlights
                container.querySelectorAll('.highlight-group').forEach(el => {
                    el.classList.remove('highlight-group');
                });
                document.getElementById('tooltip').style.display = 'none';
            });

            byteElement.addEventListener('click', function(e) {
                const offset = parseInt(e.target.dataset.offset);
                
                if (offset < 100) return;

                const pageStart = currentPage * pageSize + (currentPage === 0 ? 100 : 0);
                
                // Check if we're in cell pointer array
                const pageType = bytes[pageStart];
                const isLeafPage = [0x0a, 0x0d].includes(pageType); 
                const headerSize = isLeafPage ? 8 : 12;
                const cellCount = new DataView(bytes.buffer).getUint16(pageStart + 3, false);
                const cellPointerStart = pageStart + headerSize;

                if (offset >= cellPointerStart && offset < cellPointerStart + (cellCount * 2)) {
                    // Get the full pointer value
                    const pointerOffset = cellPointerStart + Math.floor((offset - cellPointerStart)/2)*2;
                    const pointer1 = new DataView(bytes.buffer).getUint16(pointerOffset, false);
                    const pointer = pointer1 + currentPage * pageSize; 

                    // Scroll to cell and highlight
                    scrollToOffset(pointer);
                    const cellInfo = parseCell(pageType, bytes, pointer);
                    showCellViewer(cellInfo, pointer);
                }
            });

            rowDiv.appendChild(byteElement);
        }

        // Check if the value of all children with class .hex-byte is equal to 0x00
        const isEmptyRow = Array.from(rowDiv.children)
            .every(child => child.className === 'offset-label' || child.textContent === '00');
        
        if (isEmptyRow) {
            consecutiveEmptyRows += 1;
        } else {
            consecutiveEmptyRows = 0;
        }

        if (consecutiveEmptyRows < 2) {
            container.appendChild(rowDiv);
        } else if (consecutiveEmptyRows === 2) {
            rowDiv.getElementsByClassName('offset-label')[0].textContent = '   *';
            rowDiv.getElementsByClassName('offset-label')[0].classList.add('keep-whiteSpace')
            rowDiv.querySelectorAll('.hex-byte').forEach(el => el.style.display = 'none')
            container.appendChild(rowDiv);
        }
    }
}

function parseVarint(bytes, offset) {
    let result = 0;
    let shift = 0;
    let bytesRead = 0;
    
    while (true) {
        result |= (bytes[offset] & 0x7f) << shift;
        bytesRead++;
        if ((bytes[offset++] & 0x80) === 0) break;
        shift += 7;
    }
    
    return { value: result, bytesRead };
}

function parseRecordHeader(bytes, offset, headerSize) {
    let analysis = [];
    let currentOffset = offset;
    const endOffset = offset + headerSize;
    
    while (currentOffset < endOffset) {
        const typeInfo = parseVarint(bytes, currentOffset);
        currentOffset += typeInfo.bytesRead;
        
        const typeCode = typeInfo.value;
        analysis.push(decodeType(typeCode));
    }
    
    return analysis.join('\n');
}

function decodeType(code) {
    // SQLite serial type decoding
    if (code === 0) return 'NULL';
    if (code === 1) return 'INTEGER (1 byte)';
    if (code === 2) return 'INTEGER (2 bytes)';
    if (code === 3) return 'INTEGER (3 bytes)';
    if (code === 4) return 'INTEGER (4 bytes)';
    if (code === 5) return 'INTEGER (6 bytes)';
    if (code === 6) return 'INTEGER (8 bytes)';
    if (code === 7) return 'FLOAT (8-byte IEEE)';
    if (code === 8) return 'INTEGER 0';
    if (code === 9) return 'INTEGER 1';
    if (code > 12 && code % 2 === 0) return `TEXT (${(code-12)/2} chars)`;
    if (code > 13 && code % 2 === 1) return `BLOB (${(code-13)/2} bytes)`;
    return `UNKNOWN TYPE (0x${code.toString(16)})`;
}

function parseCell(pageType, bytes, offset) {
    let result = { type: pageTypes[pageType], fields: [] };
    
    switch(pageType) {
        case 0x0d: // Table Leaf
            // Parse payload size (varint)
            let payloadSize = 0;
            let shift = 0;
            do {
                payloadSize |= (bytes[offset] & 0x7f) << shift;
                shift += 7;
            } while (bytes[offset++] & 0x80);
            
            // Parse RowID (varint)
            let rowId = 0;
            shift = 0;
            do {
                rowId |= (bytes[offset] & 0x7f) << shift;
                shift += 7;
            } while (bytes[offset++] & 0x80);
            
            result.fields.push(
                { name: "Payload Size", value: payloadSize, type: "varint" },
                { name: "Row ID", value: rowId, type: "varint" },
                { name: "Payload Start", value: offset, type: "offset" }
            );
            
            // Parse record header
            const headerSize = parseVarint(bytes, offset);
            offset += headerSize.bytesRead;
            
            result.fields.push({
                name: "Record Header",
                value: `Columns: ${headerSize.value} bytes`,
                details: parseRecordHeader(bytes, offset, headerSize.value)
            });
            
            break;
            
        // Add cases for other page types
    }
    return result;
}

function showCellViewer(cellInfo, offset) {
    const viewer = document.getElementById('cell-viewer');
    viewer.classList.remove('hidden');
    
    let html = `
        <div class="cell-field">
            <div class="data-type">${cellInfo.type} Cell</div>
            Offset: 0x${offset.toString(16)}
        </div>
    `;
    
    cellInfo.fields.forEach(field => {
        html += `
            <div class="cell-field">
                <div class="field-header">
                    <span class="data-type">${field.name}</span>
                    ${field.type ? `<span class="type-info">${field.type}</span>` : ''}
                </div>
                <div class="field-value">${field.value}</div>
                ${field.details ? `<pre class="field-details">${field.details}</pre>` : ''}
            </div>
        `;
    });
    
    document.getElementById('cell-content').innerHTML = html;
}

function closeCellViewer() {
    document.getElementById('cell-viewer').classList.add('hidden');
}

// Toggle function
function toggleView() {
    showHex = !showHex;
    const container = document.getElementById('hex-container');
    container.classList.toggle('ascii-mode');
    
    document.querySelectorAll('.hex-byte').forEach(byte => {
        const offset = parseInt(byte.dataset.offset);
        const value = currentBytes[offset];
        
        if (showHex) {
            byte.textContent = value.toString(16).padStart(2, '0');
        } else {
            if (value >= 32 && value <= 126) {
                byte.textContent = String.fromCharCode(value);
            } else {
                byte.innerHTML = '<span class="non-printable">·</span>';
            }
        }
    });
    
    document.getElementById('toggle-view').textContent = 
        showHex ? 'ASCII View' : 'Hex View';
}

document.getElementById('load-sample').addEventListener('click', async () => {
    try {
        showLoading();
        
        // Fetch sample database from repo
        const response = await fetch('https://jfompe.github.io/sqlite-viewer/sample.db?cache=' + Date.now());
        if (!response.ok) throw new Error('Failed to load sample');
        const arrayBuffer = await response.arrayBuffer();
        
        // Process like regular file
        const bytes = new Uint8Array(arrayBuffer);
        hexContainer.classList.remove('hidden');
        dropZone.classList.add('hidden');
        displayHex(bytes);
        
        // Update metadata
        fileMeta.textContent = `Sample database (${(arrayBuffer.byteLength/1024).toFixed(2)} KB)`;
        resetButton.classList.remove('hidden');
        toggleButton.classList.remove('hidden');
        contentArea.classList.remove('hidden');
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});