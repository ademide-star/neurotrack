from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os

app = Flask(__name__)
CORS(app, origins=["https://neurotrack-ten.vercel.app", "http://localhost:3000", "*"])

@app.route("/")
def health():
    return jsonify({"message": "NeuroMatrix Biosystems server running", "status": "ok"})

@app.route("/process", methods=["POST"])
def process():
    if "video" not in request.files:
        return jsonify({"error": "No video file received"}), 400

    file = request.files["video"]
    
    # Save uploaded video temporarily
    temp_path = "temp_video.mp4"
    file.save(temp_path)

    positions = []

    try:
        cap = cv2.VideoCapture(temp_path)

        if not cap.isOpened():
            return jsonify({"error": "Could not open video file"}), 400

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            blur = cv2.GaussianBlur(gray, (11, 11), 0)
            _, thresh = cv2.threshold(blur, 60, 255, cv2.THRESH_BINARY_INV)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            if contours:
                largest = max(contours, key=cv2.contourArea)
                M = cv2.moments(largest)
                if M["m00"] != 0:
                    cx = int(M["m10"] / M["m00"])
                    cy = int(M["m01"] / M["m00"])
                    positions.append({"x": cx, "y": cy})

        cap.release()

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return jsonify({
        "positions": positions,
        "total_frames": len(positions),
        "status": "success"
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)



https://YOUR-RENDER-URL.onrender.com/
