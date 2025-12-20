from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import pickle
import numpy as np
import os
import base64
import cv2  # OpenCV for faster image processing
from werkzeug.utils import secure_filename

# Initialize Flask app with CORS enabled (allows frontend to connect)
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
encodings_dir = os.path.join(script_dir, "encodings")
known_faces_dir = os.path.join(script_dir, "known_faces")

# Ensure directories exist
os.makedirs(encodings_dir, exist_ok=True)
os.makedirs(known_faces_dir, exist_ok=True)

encodings_path = os.path.join(encodings_dir, "encodings.pkl")

# Global variables to store encodings (loaded on startup)
known_encodings = []
known_names = []


def load_encodings():
    """Load face encodings from pickle file"""
    global known_encodings, known_names
    try:
        if os.path.exists(encodings_path):
            with open(encodings_path, "rb") as f:
                data = pickle.load(f)
                known_encodings = data["encodings"]
                known_names = data["names"]
            print(f"Loaded {len(known_encodings)} face encodings")
        else:
            print("No encodings file found. Starting fresh.")
            known_encodings = []
            known_names = []
    except Exception as e:
        print(f"Error loading encodings: {e}")
        known_encodings = []
        known_names = []


def save_encodings():
    """Save face encodings to pickle file"""
    try:
        data = {"encodings": known_encodings, "names": known_names}
        with open(encodings_path, "wb") as f:
            pickle.dump(data, f)
        print(f"Saved {len(known_encodings)} face encodings")
        return True
    except Exception as e:
        print(f"Error saving encodings: {e}")
        return False


def base64_to_image(base64_string):
    """Convert base64 string to OpenCV Image (numpy array)"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 to bytes
        image_data = base64.b64decode(base64_string)
        
        # Convert to numpy array
        nPARR = np.frombuffer(image_data, np.uint8)
        
        # Decode image using OpenCV
        image = cv2.imdecode(nPARR, cv2.IMREAD_COLOR)
        
        return image
    except Exception as e:
        print(f"Error converting base64 to image: {e}")
        return None


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "Face Recognition API is running (OpenCV Enabled)",
        "loaded_faces": len(known_names)
    })


@app.route('/api/encode', methods=['POST'])
def encode_faces():
    """
    Encode faces from uploaded images
    Expects: JSON with 'name' and 'images' (array of base64 strings)
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        person_name = data.get('name', '').strip()
        images = data.get('images', [])
        
        if not person_name:
            return jsonify({"error": "Person name is required"}), 400
        
        if not images or len(images) == 0:
            return jsonify({"error": "At least one image is required"}), 400
        
        # Create person folder
        person_folder = os.path.join(known_faces_dir, secure_filename(person_name))
        os.makedirs(person_folder, exist_ok=True)
        
        encoded_count = 0
        failed_count = 0
        
        # Process each image
        for idx, image_base64 in enumerate(images):
            try:
                # Convert base64 to image (BGR format)
                image = base64_to_image(image_base64)
                if image is None:
                    failed_count += 1
                    continue
                
                # Convert to RGB for face_recognition
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
                # Get face encoding
                encodings = face_recognition.face_encodings(rgb_image)
                
                if len(encodings) > 0:
                    # Add encoding and name
                    known_encodings.append(encodings[0])
                    known_names.append(person_name)
                    encoded_count += 1
                    
                    # Save image to person folder using OpenCV
                    image_filename = f"image_{idx + 1}.jpg"
                    image_path = os.path.join(person_folder, image_filename)
                    cv2.imwrite(image_path, image)
                else:
                    failed_count += 1
                    
            except Exception as e:
                print(f"Error processing image {idx + 1}: {e}")
                failed_count += 1
                continue
        
        # Save encodings to file
        if encoded_count > 0:
            save_success = save_encodings()
            if not save_success:
                return jsonify({
                    "error": "Faces encoded but failed to save to file"
                }), 500
        
        return jsonify({
            "success": True,
            "message": f"Encoded {encoded_count} face(s) for {person_name}",
            "encoded_count": encoded_count,
            "failed_count": failed_count,
            "total_faces": len(known_names)
        }), 200
        
    except Exception as e:
        print(f"Error in encode_faces: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/recognize', methods=['POST'])
def recognize_face():
    """
    Recognize faces in an image frame (Optimized with OpenCV)
    Expects: JSON with 'image' (base64 string)
    Returns: Array of recognized faces with locations and names
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        image_base64 = data.get('image', '')
        
        if not image_base64:
            return jsonify({"error": "Image is required"}), 400
        
        # Reload encodings to stay up to date
        if not known_encodings:
             load_encodings()
        
        if len(known_encodings) == 0:
            return jsonify({
                "faces": [],
                "message": "No faces in database. Please encode faces first."
            }), 200
        
        # Convert base64 to image (BGR format)
        image = base64_to_image(image_base64)
        if image is None:
            return jsonify({"error": "Invalid image format"}), 400
        
        # PERFORMANCE OPTIMIZATION: Resize image to 1/4 size
        small_image = cv2.resize(image, (0, 0), fx=0.25, fy=0.25)
        
        # Convert small image to RGB
        rgb_small_image = cv2.cvtColor(small_image, cv2.COLOR_BGR2RGB)
        
        # Find faces in frame
        face_locations = face_recognition.face_locations(rgb_small_image)
        face_encodings = face_recognition.face_encodings(rgb_small_image, face_locations)
        
        recognized_faces = []
        
        # Loop through detected faces
        for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
            # Scale back up face locations since the frame we detected in was scaled to 1/4 size
            top *= 4
            right *= 4
            bottom *= 4
            left *= 4

            # Compare with known faces
            matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.6)
            name = "Unknown"
            confidence = 0.0
            
            # Calculate face distances for best match
            face_distances = face_recognition.face_distance(known_encodings, face_encoding)
            
            if True in matches:
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    name = known_names[best_match_index]
                    confidence = max(0, 1 - face_distances[best_match_index])
            
            recognized_faces.append({
                "name": name,
                "confidence": round(confidence, 2),
                "location": {
                    "top": int(top),
                    "right": int(right),
                    "bottom": int(bottom),
                    "left": int(left)
                }
            })
        
        return jsonify({
            "faces": recognized_faces,
            "count": len(recognized_faces)
        }), 200
        
    except Exception as e:
        print(f"Error in recognize_face: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/faces', methods=['GET'])
def get_faces():
    """Get list of all encoded faces"""
    try:
        load_encodings()
        
        # Get unique names and count
        unique_names = {}
        for name in known_names:
            unique_names[name] = unique_names.get(name, 0) + 1
        
        faces_list = [
            {"name": name, "image_count": count}
            for name, count in unique_names.items()
        ]
        
        return jsonify({
            "faces": faces_list,
            "total": len(known_names)
        }), 200
        
    except Exception as e:
        print(f"Error in get_faces: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Load encodings on startup
    load_encodings()
    
    # Run the Flask app
    print("Starting Face Recognition API Server (with OpenCV)...")
    print("API will be available at http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)

