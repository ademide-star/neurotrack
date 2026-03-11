from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os
import traceback

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024
CORS(app, origins=["*"])

@app.route("/")
def health():
    return jsonify({"message": "NeuroMatrix Biosystems server running", "status": "ok"})

@app.route("/process", methods=["POST"])
def process():
    if "video" not in request.files:
        return jsonify({"error": "No video file received"}), 400

    file = request.files["video"]
    temp_path = "temp_video.mp4"
    
    try:
        # Save uploaded file
        file.save(temp_path)
        print(f"[Server] Video saved: {temp_path}")
        print(f"[Server] File size: {os.path.getsize(temp_path)} bytes")

        cap = cv2.VideoCapture(temp_path)

        if not cap.isOpened():
            return jsonify({"error": "Could not open video — unsupported format"}), 400

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        print(f"[Server] Video info: {width}x{height} @ {fps}fps, {total_frames} frames")

        positions = []
        frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1

            # Skip frames for speed (process every 2nd frame)
           if frame_count % 5 != 0:
              continue

            try:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                blur = cv2.GaussianBlur(gray, (11, 11), 0)
                _, thresh = cv2.threshold(
                    blur, 60, 255, cv2.THRESH_BINARY_INV
                )
                contours, _ = cv2.findContours(
                    thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
                )

                if contours:
                    largest = max(contours, key=cv2.contourArea)
                    area = cv2.contourArea(largest)
                    
                    # Filter out noise
                    if area > 50:
                        M = cv2.moments(largest)
                        if M["m00"] != 0:
                            cx = int(M["m10"] / M["m00"])
                            cy = int(M["m01"] / M["m00"])
                            
                            # Normalize to 600x600 canvas
                            nx = int((cx / width) * 600)
                            ny = int((cy / height) * 600)
                            
                            positions.append({"x": nx, "y": ny})

            except Exception as frame_err:
                print(f"[Server] Frame error at {frame_count}: {frame_err}")
                continue

        cap.release()
        print(f"[Server] Processing complete: {len(positions)} positions")

        return jsonify({
            "positions": positions,
            "total_frames": len(positions),
            "video_info": {
                "width": width,
                "height": height,
                "fps": fps,
                "total_frames": total_frames
            },
            "status": "success"
        })

    except Exception as e:
        print(f"[Server] Error: {traceback.format_exc()}")
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            print("[Server] Temp file cleaned up")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[Server] Starting NeuroMatrix server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)


