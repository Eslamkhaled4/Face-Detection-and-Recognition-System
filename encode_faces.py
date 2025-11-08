import face_recognition
import pickle
import os

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Dictionary to store encodings
known_encodings = []
known_names = []

# Path to known faces (relative to script location)
known_faces_dir = os.path.join(script_dir, "known_faces")

print("Encoding faces...")

# Loop through each person's folder
for person_name in os.listdir(known_faces_dir):
    person_folder = os.path.join(known_faces_dir, person_name)
    
    if not os.path.isdir(person_folder):
        continue
    
    # Loop through each photo
    for photo_name in os.listdir(person_folder):
        photo_path = os.path.join(person_folder, photo_name)
        
        # Load image
        image = face_recognition.load_image_file(photo_path)
        
        # Get face encoding
        encodings = face_recognition.face_encodings(image)
        
        if len(encodings) > 0:
            known_encodings.append(encodings[0])
            known_names.append(person_name)
            print(f"✓ Encoded {person_name} - {photo_name}")
        else:
            print(f"✗ No face found in {photo_path}")

# Save encodings to file
encodings_dir = os.path.join(script_dir, "encodings")
os.makedirs(encodings_dir, exist_ok=True)  # Create directory if it doesn't exist
encodings_path = os.path.join(encodings_dir, "encodings.pkl")
data = {"encodings": known_encodings, "names": known_names}
with open(encodings_path, "wb") as f:
    pickle.dump(data, f)

print(f"\nDone! Encoded {len(known_encodings)} faces.")