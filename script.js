// Configuration
const config = {
    itemsPerPage: 6,
    maxFileSizeMB: 50,
    imageQuality: 1.0, // Always high quality
    scale: 2.5 // Fixed high resolution scale
};

// State management
let state = {
    imagesData: [],
    currentPage: 1,
    pdfDoc: null,
    conversionInProgress: false,
    activeUploadMethod: 'drop'
};

// DOM Elements
const elements = {
    dropFileInput: document.getElementById('dropFileInput'),
    urlInput: document.getElementById('urlInput'),
    loadUrlBtn: document.getElementById('loadUrlBtn'),
    urlInfo: document.getElementById('urlInfo'),
    dropFileInfo: document.getElementById('dropFileInfo'),
    convertBtn: document.getElementById('convertBtn'),
    downloadZipBtn: document.getElementById('downloadZipBtn'),
    loading: document.getElementById('loading'),
    progressContainer: document.getElementById('progressContainer'),
    progressText: document.getElementById('progressText'),
    progressBarInner: document.getElementById('progressBarInner'),
    previewContainer: document.getElementById('previewContainer'),
    paginationControls: document.getElementById('paginationControls'),
    pageInfo: document.getElementById('pageInfo'),
    errorContainer: document.getElementById('errorContainer'),
    pdfCanvas: document.getElementById('pdf-canvas'),
    dropArea: document.getElementById('dropArea'),
    uploadTabs: document.querySelectorAll('.upload-tab'),
    uploadPanels: document.querySelectorAll('.upload-panel'),
    advancedOptions: document.querySelector('.advanced-options'),
    advancedHeader: document.querySelector('.advanced-header'),
    pageRangeInput: document.getElementById('pageRange')
};

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

function showError(message) {
    elements.errorContainer.textContent = message;
    elements.errorContainer.style.display = 'block';
    setTimeout(() => {
        elements.errorContainer.style.display = 'none';
    }, 5000);
}

function resetUI() {
    elements.loading.style.display = 'none';
    elements.progressContainer.style.display = 'none';
    elements.previewContainer.innerHTML = '';
    elements.paginationControls.style.display = 'none';
    elements.errorContainer.style.display = 'none';
    state.conversionInProgress = false;
}

function switchUploadMethod(method) {
    state.activeUploadMethod = method;
    
    // Update tabs
    elements.uploadTabs.forEach(tab => {
        if (tab.dataset.tab === method) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update panels
    elements.uploadPanels.forEach(panel => {
        if (panel.id === `${method}-panel`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });
    
    // Clear any previous file info
    elements.urlInfo.innerHTML = '';
    elements.dropFileInfo.innerHTML = '';
    elements.downloadZipBtn.disabled = true;
    resetUI();
}

// Parse page range input (e.g., "1-3,5,7-9")
function parsePageRange(rangeStr, totalPages) {
    if (!rangeStr.trim()) {
        // Return all pages if input is empty
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set();
    const parts = rangeStr.split(',');

    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (isNaN(start) || isNaN(end)) continue;  // Fixed the missing closing parenthesis here
            const actualStart = Math.max(1, Math.min(start, totalPages));
            const actualEnd = Math.max(1, Math.min(end, totalPages));
            for (let i = actualStart; i <= actualEnd; i++) {
                pages.add(i);
            }
        } else {
            const pageNum = Number(part);
            if (!isNaN(pageNum)) {
                const actualPage = Math.max(1, Math.min(pageNum, totalPages));
                pages.add(actualPage);
            }
        }
    }

    return Array.from(pages).sort((a, b) => a - b);
}


async function startConversion() {
    if (state.conversionInProgress) return;
    
    let file;
    
    if (state.activeUploadMethod === 'drop' && elements.dropFileInput.files.length) {
        file = elements.dropFileInput.files[0];
    } else if (state.activeUploadMethod === 'url' && state.pdfDoc) {
        // For URL, we already have the PDF doc
    } else {
        showError("Please select a PDF file first!");
        return;
    }

    // Validate file size (not applicable for URL)
    if (file) {
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > config.maxFileSizeMB) {
            showError(`File size exceeds limit of ${config.maxFileSizeMB}MB`);
            return;
        }
    }

    state.conversionInProgress = true;
    elements.convertBtn.disabled = true;
    elements.loading.style.display = 'block';
    elements.progressContainer.style.display = 'block';

    try {
        if (state.activeUploadMethod === 'url') {
            await convertPDF(null); // We already have the PDF doc for URL
        } else {
            const pdfData = await readFileAsArrayBuffer(file);
            await convertPDF(pdfData);
        }
    } catch (error) {
        console.error("Conversion error:", error);
        showError("Failed to process PDF: " + error.message);
        resetUI();
    } finally {
        elements.convertBtn.disabled = false;
    }
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error("File reading failed"));
        reader.readAsArrayBuffer(file);
    });
}

async function loadPDFFromUrl(url) {
    try {
        elements.loadUrlBtn.disabled = true;
        elements.loadUrlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        
        // Validate URL
        if (!url) {
            throw new Error("Please enter a valid URL");
        }
        
        // Try to fetch the PDF
        const loadingTask = pdfjsLib.getDocument(url);
        state.pdfDoc = await loadingTask.promise;
        
        // Update URL info
        elements.urlInfo.innerHTML = `
            <span>PDF loaded successfully</span>
            <span>Pages: ${state.pdfDoc.numPages}</span>
            <span>Source: ${new URL(url).hostname}</span>
        `;
        
        return true;
    } catch (error) {
        console.error("URL loading error:", error);
        showError("Failed to load PDF from URL: " + error.message);
        return false;
    } finally {
        elements.loadUrlBtn.disabled = false;
        elements.loadUrlBtn.innerHTML = '<i class="fas fa-download"></i> Load PDF';
    }
}

async function convertPDF(pdfData) {
    try {
        if (!state.pdfDoc && pdfData) {
            state.pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
        }
        
        const totalPages = state.pdfDoc.numPages;
        const pageRange = elements.pageRangeInput.value.trim();
        const pagesToConvert = parsePageRange(pageRange, totalPages);
        
        if (pagesToConvert.length === 0) {
            showError("No valid pages selected for conversion");
            return;
        }
        
        state.imagesData = [];
        const zip = new JSZip();
        const startTime = Date.now();

        for (let i = 0; i < pagesToConvert.length; i++) {
            if (!state.conversionInProgress) break;
            
            const pageNum = pagesToConvert[i];
            const page = await state.pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: config.scale });
            
            // Set canvas dimensions
            elements.pdfCanvas.height = viewport.height;
            elements.pdfCanvas.width = viewport.width;
            
            // Render PDF page to canvas
            await page.render({
                canvasContext: elements.pdfCanvas.getContext('2d'),
                viewport: viewport
            }).promise;
            
            // Convert to JPG with maximum quality
            const imgData = elements.pdfCanvas.toDataURL('image/jpeg', config.imageQuality);
            state.imagesData.push({ 
                name: `page_${pageNum.toString().padStart(3, '0')}.jpg`, 
                data: imgData 
            });
            
            // Add to zip
            zip.file(`page_${pageNum}.jpg`, imgData.split(',')[1], { base64: true });
            
            // Update progress
            updateProgress(i + 1, pagesToConvert.length, startTime);
        }
        
        if (state.conversionInProgress) {
            completeConversion();
        }
    } catch (error) {
        throw error;
    }
}

function updateProgress(currentPage, totalPages, startTime) {
    const progress = Math.round((currentPage / totalPages) * 100);
    const elapsed = (Date.now() - startTime) / 1000;
    const pagesPerSecond = currentPage / elapsed;
    const remaining = Math.max(0, (totalPages - currentPage) / pagesPerSecond).toFixed(1);
    
    elements.progressText.textContent = 
        `Converting page ${currentPage} of ${totalPages} | ${progress}% | Est. time left: ${remaining}s`;
    elements.progressBarInner.style.width = `${progress}%`;
}

function completeConversion() {
    elements.loading.style.display = 'none';
    elements.downloadZipBtn.disabled = false;
    state.conversionInProgress = false;
    
    if (state.imagesData.length > 0) {
        renderPage();
        elements.paginationControls.style.display = 'flex';
        updatePageInfo();
    }
}

function renderPage() {
    elements.previewContainer.innerHTML = '';
    
    const start = (state.currentPage - 1) * config.itemsPerPage;
    const end = start + config.itemsPerPage;
    const itemsToShow = state.imagesData.slice(start, end);
    
    itemsToShow.forEach((img, index) => {
        const pageNum = start + index + 1;
        const fileName = img.name.match(/\d+/)[0];
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <div class="preview-header">Page ${fileName}</div>
            <img src="${img.data}" alt="Page ${fileName}" loading="lazy">
            <button class="download-single-btn" onclick="downloadImage('${img.data}', '${img.name}')">
                Download
            </button>
        `;
        elements.previewContainer.appendChild(div);
    });
}

function updatePageInfo() {
    const totalPages = Math.ceil(state.imagesData.length / config.itemsPerPage);
    elements.pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
}

function nextPage() {
    const totalPages = Math.ceil(state.imagesData.length / config.itemsPerPage);
    if (state.currentPage < totalPages) {
        state.currentPage++;
        renderPage();
        updatePageInfo();
    }
}

function prevPage() {
    if (state.currentPage > 1) {
        state.currentPage--;
        renderPage();
        updatePageInfo();
    }
}

function downloadImage(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function downloadZip() {
    if (!state.imagesData.length) return;
    
    elements.downloadZipBtn.disabled = true;
    elements.downloadZipBtn.textContent = 'Preparing ZIP...';
    
    try {
        const zip = new JSZip();
        state.imagesData.forEach(img => {
            zip.file(img.name, img.data.split(',')[1], { base64: true });
        });
        
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = "converted_pages.zip";
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    } catch (error) {
        showError("Failed to create ZIP file");
    } finally {
        elements.downloadZipBtn.disabled = false;
        elements.downloadZipBtn.textContent = 'Download All as ZIP';
    }
}

// Event listeners
elements.dropFileInput.addEventListener('change', async () => {
    if (elements.dropFileInput.files.length) {
        const file = elements.dropFileInput.files[0];
        const fileSizeMB = file.size / (1024 * 1024);
        
        try {
            // Get page count immediately after file selection
            const pdfData = await readFileAsArrayBuffer(file);
            const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
            const pageCount = pdfDoc.numPages;
            
            elements.dropFileInfo.innerHTML = `
                <span>File: ${file.name}</span>
                <span>Size: ${fileSizeMB.toFixed(2)} MB</span>
                <span>Pages: ${pageCount}</span>
            `;
            
            // Store the PDF doc for later conversion
            state.pdfDoc = pdfDoc;
        } catch (error) {
            console.error("Error getting page count:", error);
            elements.dropFileInfo.innerHTML = `
                <span>File: ${file.name}</span>
                <span>Size: ${fileSizeMB.toFixed(2)} MB</span>
                <span style="color: var(--error-color)">Couldn't read page count</span>
            `;
        }
        
        elements.downloadZipBtn.disabled = true;
        resetUI();
    }
});

elements.loadUrlBtn.addEventListener('click', async () => {
    const url = elements.urlInput.value.trim();
    if (url) {
        const success = await loadPDFFromUrl(url);
        if (success) {
            elements.downloadZipBtn.disabled = true;
            resetUI();
        }
    } else {
        showError("Please enter a valid URL");
    }
});

// Drag and drop events
elements.dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropArea.classList.add('drag-over');
});

elements.dropArea.addEventListener('dragleave', () => {
    elements.dropArea.classList.remove('drag-over');
});

elements.dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropArea.classList.remove('drag-over');
    
    if (e.dataTransfer.files.length) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/pdf') {
            elements.dropFileInput.files = e.dataTransfer.files;
            const event = new Event('change');
            elements.dropFileInput.dispatchEvent(event);
        } else {
            showError("Only PDF files are allowed");
        }
    }
});

// Tab switching
elements.uploadTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        switchUploadMethod(tab.dataset.tab);
    });
});

// Advanced options toggle
elements.advancedHeader.addEventListener('click', () => {
    elements.advancedOptions.classList.toggle('active');
});

// Set current year in copyright
document.getElementById('current-year').textContent = new Date().getFullYear();

// Optional: Add tooltip to version
const versionElement = document.querySelector('.app-version');
if (versionElement) {
  versionElement.title = 'Current version';
  versionElement.addEventListener('click', () => {
    console.log('App version: 1.0.0');
  });
}

// Initialize
resetUI();
switchUploadMethod('drop');
