import os

import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2, math, json

app = Flask(__name__)
CORS(app)

@app.route('/process', methods=['POST'])
def process():
    file = request.files['video']
    file.save('temp_video.mp4')
    
    cap = cv2.VideoCapture('temp_video.mp4')
    positions = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray,(11,11),0)
        _, thresh = cv2.threshold(blur,60,255,cv2.THRESH_BINARY_INV)
        contours, _ = cv2.findContours(thresh,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            largest = max(contours, key=cv2.contourArea)
            M = cv2.moments(largest)
            if M["m00"] != 0:
                cx = int(M["m10"]/M["m00"])
                cy = int(M["m01"]/M["m00"])
                positions.append({"x": cx, "y": cy})
    
    cap.release()
    return jsonify({"positions": positions})


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)