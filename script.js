// ============================================
// Page Navigation
// ============================================

/**
 * Show a specific page and hide others
 * @param {string} pageId - The ID of the page to show
 */
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update navigation active state
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });

    // Stop camera when navigating away from recognition page
    if (pageId !== 'recognition' && videoStream) {
        stopCamera();
    }
}

// Navigation link event listeners
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            showPage(pageId);
        });
    });
});

// ============================================
// API Configuration
// ============================================

// API base URL - change this if your backend runs on a different port/host
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Make API request to backend
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }

        return result;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

/**
 * Check if API server is running
 */
async function checkApiHealth() {
    try {
        const response = await apiRequest('/health');
        return response.status === 'ok';
    } catch (error) {
        return false;
    }
}

// ============================================
// Face Recognition Page - Webcam Functionality
// ============================================

let videoStream = null;
let recognitionInterval = null;

const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');
const canvasContext = canvasElement.getContext('2d');
const startCameraBtn = document.getElementById('startCameraBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const statusText = document.getElementById('statusText');
const recognizedName = document.getElementById('recognizedName');
const loadingSpinner = document.getElementById('loadingSpinner');

/**
 * Start the webcam and begin face recognition
 */
async function startCamera() {
    try {
        // Show loading spinner
        loadingSpinner.classList.remove('hidden');
        statusText.textContent = 'Initializing camera...';

        // Request camera access
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            }
        });

        // Set video source
        videoElement.srcObject = videoStream;

        // Wait for video to be ready
        videoElement.addEventListener('loadedmetadata', async () => {
            // Set canvas size to match video
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;

            // Check API health before starting recognition
            const apiHealthy = await checkApiHealth();
            if (!apiHealthy) {
                loadingSpinner.classList.add('hidden');
                statusText.textContent = 'API server not available. Please start the backend server.';
                alert('Cannot connect to API server. Please ensure the Flask backend is running on http://localhost:5000');
                stopCamera();
                return;
            }

            // Hide loading spinner
            loadingSpinner.classList.add('hidden');

            // Update UI
            statusText.textContent = 'Detecting faces...';
            startCameraBtn.disabled = true;
            stopCameraBtn.disabled = false;

            // Start face recognition
            startFaceRecognition();
        }, { once: true });

    } catch (error) {
        console.error('Error accessing camera:', error);
        loadingSpinner.classList.add('hidden');
        statusText.textContent = 'Camera access denied or unavailable';

        // Show error message
        alert('Unable to access camera. Please ensure camera permissions are granted.');
    }
}

/**
 * Stop the webcam and face recognition
 */
function stopCamera() {
    // Stop video stream
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }

    // Clear canvas
    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Stop recognition interval
    if (recognitionInterval) {
        clearInterval(recognitionInterval);
        recognitionInterval = null;
    }

    // Update UI
    statusText.textContent = 'Camera Ready';
    recognizedName.textContent = '-';
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
}

/**
 * Capture frame from video and send to API for recognition
 */
function captureFrame() {
    // Draw current video frame to canvas
    canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    // Convert canvas to base64 image
    const imageData = canvasElement.toDataURL('image/jpeg', 0.8);

    return imageData;
}

/**
 * Start face recognition by sending frames to backend API
 */
function startFaceRecognition() {
    // Send frame to API every 1 second (adjust interval as needed)
    recognitionInterval = setInterval(async () => {
        try {
            // Capture frame
            const frameData = captureFrame();

            // Send to API
            const result = await apiRequest('/recognize', 'POST', {
                image: frameData
            });

            // Process recognition results
            if (result.faces && result.faces.length > 0) {
                // Get the first recognized face (or most confident)
                const recognizedFace = result.faces[0];

                if (recognizedFace.name !== 'Unknown') {
                    recognizedName.textContent = recognizedFace.name;
                    recognizedName.style.color = 'var(--success-color)';

                    // Draw bounding box
                    drawFaceBox(recognizedFace);
                } else {
                    recognizedName.textContent = 'Unknown';
                    recognizedName.style.color = 'var(--warning-color)';

                    // Clear canvas
                    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
                }
            } else {
                recognizedName.textContent = 'No face detected';
                recognizedName.style.color = 'var(--text-muted)';

                // Clear canvas
                canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
            }
        } catch (error) {
            console.error('Recognition error:', error);
            recognizedName.textContent = 'Recognition error';
            recognizedName.style.color = 'var(--danger-color)';
        }
    }, 200); // Send frame every 200ms
}

/**
 * Draw face bounding box on canvas based on recognition result
 */
function drawFaceBox(faceData) {
    // Clear previous drawings (but keep video frame)
    // We'll redraw the video frame first
    canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    if (!faceData || !faceData.location) {
        return;
    }

    const loc = faceData.location;
    const x = loc.left;
    const y = loc.top;
    const width = loc.right - loc.left;
    const height = loc.bottom - loc.top;

    // Draw bounding box
    const color = faceData.name !== 'Unknown' ? '#10b981' : '#f59e0b';
    canvasContext.strokeStyle = color;
    canvasContext.lineWidth = 3;
    canvasContext.strokeRect(x, y, width, height);

    // Draw label background
    const labelText = faceData.name;
    const labelHeight = 30;
    canvasContext.fillStyle = color;
    canvasContext.fillRect(x, y - labelHeight, width, labelHeight);

    // Draw label text
    canvasContext.fillStyle = '#ffffff';
    canvasContext.font = 'bold 16px Arial';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(labelText, x + width / 2, y - 8);

    // Draw confidence if available
    if (faceData.confidence && faceData.name !== 'Unknown') {
        const confidenceText = `${Math.round(faceData.confidence * 100)}%`;
        canvasContext.font = '12px Arial';
        canvasContext.fillText(confidenceText, x + width / 2, y + height + 20);
    }
}

// Event listeners for camera buttons
startCameraBtn.addEventListener('click', startCamera);
stopCameraBtn.addEventListener('click', stopCamera);

// ============================================
// Encode Faces Page - Image Upload & Encoding
// ============================================

const imageInput = document.getElementById('imageInput');
const personNameInput = document.getElementById('personName');
const imagePreview = document.getElementById('imagePreview');
const encodeBtn = document.getElementById('encodeBtn');
const messageArea = document.getElementById('messageArea');

let uploadedImages = [];

/**
 * Handle image file selection
 */
imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = (event) => {
                uploadedImages.push({
                    file: file,
                    dataUrl: event.target.result
                });
                updateImagePreview();
            };

            reader.readAsDataURL(file);
        }
    });
});

/**
 * Update the image preview area
 */
function updateImagePreview() {
    imagePreview.innerHTML = '';

    uploadedImages.forEach((image, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';

        const img = document.createElement('img');
        img.src = image.dataUrl;
        img.alt = 'Preview';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => removeImage(index);

        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        imagePreview.appendChild(previewItem);
    });
}

/**
 * Remove an image from the preview
 */
function removeImage(index) {
    uploadedImages.splice(index, 1);
    updateImagePreview();
}

/**
 * Show a message in the message area
 */
function showMessage(text, type = 'info') {
    messageArea.innerHTML = '';

    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.textContent = text;

    messageArea.appendChild(message);

    // Auto-remove success/info messages after 5 seconds
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            message.remove();
        }, 5000);
    }
}

/**
 * Encode faces by sending images to backend API
 */
async function encodeFaces() {
    // Validation
    if (uploadedImages.length === 0) {
        showMessage('Please select at least one image', 'error');
        return;
    }

    if (!personNameInput.value.trim()) {
        showMessage('Please enter a person name', 'error');
        return;
    }

    // Check API health
    const apiHealthy = await checkApiHealth();
    if (!apiHealthy) {
        showMessage('API server not available. Please start the backend server.', 'error');
        return;
    }

    // Disable button during encoding
    encodeBtn.disabled = true;
    encodeBtn.textContent = 'Encoding...';
    showMessage('Encoding faces...', 'info');

    try {
        // Extract base64 data from uploaded images
        const imageBase64Array = uploadedImages.map(img => {
            // Remove data URL prefix if present
            return img.dataUrl.includes(',') ? img.dataUrl.split(',')[1] : img.dataUrl;
        });

        // Send to API
        const result = await apiRequest('/encode', 'POST', {
            name: personNameInput.value.trim(),
            images: imageBase64Array
        });

        if (result.success) {
            showMessage(
                result.message || `Successfully encoded ${result.encoded_count} face(s) for "${personNameInput.value}"`,
                'success'
            );

            // Clear form
            uploadedImages = [];
            personNameInput.value = '';
            imageInput.value = '';
            updateImagePreview();
        } else {
            showMessage('Encoding failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Encoding error:', error);
        showMessage(`Encoding failed: ${error.message}`, 'error');
    } finally {
        // Re-enable button
        encodeBtn.disabled = false;
        encodeBtn.textContent = 'Encode Face';
    }
}

// Event listener for encode button
encodeBtn.addEventListener('click', encodeFaces);

// ============================================
// Cleanup on page unload
// ============================================
window.addEventListener('beforeunload', () => {
    if (videoStream) {
        stopCamera();
    }
});

