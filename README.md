# Face Recognition System - Full Stack Application

A real-time face detection and recognition system with a modern web UI and Python backend.

## 🚀 Features

- **Real-time Face Recognition**: Detect and recognize faces from webcam feed
- **Face Encoding**: Upload images to encode new faces into the system
- **Modern UI**: Clean, responsive, dark-mode friendly interface
- **REST API**: Flask backend with CORS support
- **Webcam Integration**: Browser-based camera access

## 📋 Prerequisites

- Python 3.8 or higher
- Webcam (for face recognition)
- Modern web browser (Chrome, Firefox, Edge, Safari)

## 🛠️ Installation

### 1. Install Python Dependencies

Navigate to the `Face-Detection-and-Recognition-System` directory:

```bash
cd Face-Detection-and-Recognition-System
pip install -r requirements.txt
```

#### ⚠️ Windows Installation - dlib Requirements

**dlib** requires Visual C++ Build Tools on Windows. You have two options:

##### Option 1: Install Visual C++ Build Tools (Recommended)

1. Download and install **Visual Studio Build Tools**:
   - Go to: https://visualstudio.microsoft.com/downloads/
   - Scroll down to "Tools for Visual Studio" section
   - Download **"Build Tools for Visual Studio 2022"**
   - During installation, select **"Desktop development with C++"** workload
   - This includes MSVC compiler, Windows SDK, and CMake tools

2. After installation, restart your terminal/PowerShell

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

##### Option 2: Use Pre-built dlib Wheel (Easier, but may have compatibility issues)

Try installing dlib from a pre-built wheel:

```bash
# First install other dependencies (excluding dlib)
pip install Flask flask-cors face-recognition opencv-python numpy Pillow

# Then try installing dlib from an unofficial source (if available)
# Or use conda which often has pre-built binaries:
# conda install -c conda-forge dlib
```

##### Option 3: Use Conda (Easiest for Windows)

If you have Anaconda/Miniconda installed:

```bash
conda install -c conda-forge dlib face-recognition
pip install Flask flask-cors opencv-python
```

**Note**: Installing `dlib` and `face-recognition` may require additional system dependencies:
- **Windows**: Visual C++ Build Tools (see above)
- **Linux**: `sudo apt-get install cmake libopenblas-dev liblapack-dev`
- **macOS**: `brew install cmake`

### 2. Start the Backend Server

**Easy Way (Windows):**
- Double-click `start_server.bat` in the `Face-Detection-and-Recognition-System` folder

**Command Line:**
```bash
cd Face-Detection-and-Recognition-System
python api_server.py
```

The server will start on `http://localhost:5000`

You should see:
```
Starting Face Recognition API Server...
API will be available at http://localhost:5000
Loaded X face encodings
 * Running on http://0.0.0.0:5000
```

**Note:** Keep this terminal window open while using the application.

### 3. Open the Frontend

Open `index.html` in your web browser. You can:

- **Option 1**: Double-click `index.html` to open it in your default browser
- **Option 2**: Use a local web server (recommended):
  ```bash
  # Using Python
  python -m http.server 8000
  
  # Then open http://localhost:8000 in your browser
  ```

## 📖 Usage

### Encoding New Faces

1. Navigate to **"Encode Faces"** page
2. Click **"Choose Images"** and select one or more images of a person
3. Enter the person's name in the input field
4. Click **"Encode Face"**
5. Wait for the success message

The images will be saved in `Face-Detection-and-Recognition-System/known_faces/[PersonName]/`

### Face Recognition

1. Navigate to **"Face Recognition"** page
2. Click **"Start Camera"** (grant camera permissions when prompted)
3. The system will detect and recognize faces in real-time
4. Recognized names will appear below the video feed
5. Click **"Stop Camera"** when done

## 🏗️ Project Structure

```
FaceDetection/
├── index.html              # Frontend: Main HTML file
├── style.css               # Frontend: Stylesheet
├── script.js               # Frontend: JavaScript (API calls, webcam)
├── README.md               # This file - Main documentation
│
└── Face-Detection-and-Recognition-System/
    ├── api_server.py       # Backend: Flask API server (MAIN SERVER)
    ├── requirements.txt    # Python dependencies list
    ├── start_server.bat    # Windows: Easy startup script (double-click)
    ├── check_setup.py      # Utility: Check if dependencies are installed
    │
    ├── INSTALL_WINDOWS.md  # Windows installation guide
    ├── TROUBLESHOOTING.md  # Troubleshooting guide
    │
    ├── encodings/          # Auto-generated: Face encodings storage
    │   └── encodings.pkl   # Binary file with face data
    │
    └── known_faces/        # Storage: Person images (organized by name)
        ├── PersonName1/
        │   └── image_1.jpg
        └── PersonName2/
            └── image_1.jpg
```

## 🔌 API Endpoints

### `GET /api/health`
Check if the API server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Face Recognition API is running",
  "loaded_faces": 5
}
```

### `POST /api/encode`
Encode faces from uploaded images.

**Request Body:**
```json
{
  "name": "John Doe",
  "images": ["base64_image1", "base64_image2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Encoded 2 face(s) for John Doe",
  "encoded_count": 2,
  "failed_count": 0,
  "total_faces": 5
}
```

### `POST /api/recognize`
Recognize faces in an image frame.

**Request Body:**
```json
{
  "image": "base64_image_string"
}
```

**Response:**
```json
{
  "faces": [
    {
      "name": "John Doe",
      "confidence": 0.92,
      "location": {
        "top": 100,
        "right": 300,
        "bottom": 350,
        "left": 150
      }
    }
  ],
  "count": 1
}
```

### `GET /api/faces`
Get list of all encoded faces.

**Response:**
```json
{
  "faces": [
    {"name": "John Doe", "image_count": 3},
    {"name": "Jane Smith", "image_count": 2}
  ],
  "total": 5
}
```

## ⚙️ Configuration

### Change API URL

If your backend runs on a different port, edit `script.js`:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

Change `5000` to your port number.

## 🐛 Troubleshooting

**Quick Check:**
1. Run `python check_setup.py` to verify all dependencies are installed
2. Make sure the server is running (see "Start the Backend Server" above)
3. Check browser console (F12) for JavaScript errors

**Common Issues:**

### Camera Not Working
- Ensure you've granted camera permissions in your browser
- Check if another application is using the camera
- Try refreshing the page

### API Connection Errors
- Ensure the Flask server is running (`python api_server.py` or use `start_server.bat`)
- Check that the API URL in `script.js` matches your server address
- Test API: Open `http://localhost:5000/api/health` in browser
- Verify CORS is enabled (it should be by default)

### Face Recognition Not Working
- Make sure you've encoded at least one face first (use "Encode Faces" page)
- Ensure good lighting conditions
- Face should be clearly visible and front-facing
- Use multiple images per person for better accuracy

### Installation Issues

#### dlib Installation Fails on Windows

**Error**: "You must use Visual Studio to build a python extension"

**Solution**: 
1. Install Visual Studio Build Tools (see Installation section above)
2. Or use Conda: `conda install -c conda-forge dlib`
3. Or try installing from a pre-built wheel (search for "dlib wheel windows" online)

#### face-recognition Import Error
- Ensure dlib is installed correctly first
- Try: `pip install --upgrade face-recognition`
- Verify installation: `python -c "import face_recognition; print('OK')"`

#### Other Issues
- **CMake not found**: Install CMake from https://cmake.org/download/
- **Permission errors**: Run terminal as Administrator (Windows) or use `sudo` (Linux/Mac)

## 📝 Notes

- The first time you encode faces, the `encodings` directory will be created automatically
- Face recognition accuracy improves with multiple images per person
- The system uses a tolerance of 0.6 for face matching (adjustable in `api_server.py`)
- Images are automatically saved to the `known_faces` directory when encoding

## 🔒 Security Notes

- This is a development setup. For production:
  - Use HTTPS
  - Implement authentication
  - Add rate limiting
  - Validate and sanitize inputs
  - Use environment variables for configuration

## 📄 License

This project is for educational purposes.

## 👥 Credits

Built with:
- [face_recognition](https://github.com/ageitgey/face_recognition) library
- OpenCV
- Flask
- Vanilla JavaScript

