import os
import cv2
import numpy as np
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["*"])
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024

# ─── UTILS ────────────────────────────────────────────────────────────────────

def save_temp(file, name="temp_video.mp4"):
    file.save(name)
    return name

def open_video(path):
    for backend in [cv2.CAP_ANY, cv2.CAP_FFMPEG, cv2.CAP_MSMF]:
        cap = cv2.VideoCapture(path, backend)
        if cap.isOpened():
            return cap
    return None

def get_video_info(cap):
    return {
        "width":  int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))  or 640,
        "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480,
        "fps":    cap.get(cv2.CAP_PROP_FPS) or 30,
        "total":  int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
    }

def detect_subject(frame, threshold=60):
    """Detect rat/subject in frame — returns (cx, cy, area) or None"""
    gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur  = cv2.GaussianBlur(gray, (11, 11), 0)
    # Try dark-on-light first
    _, thresh = cv2.threshold(blur, threshold, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    # If nothing found, try light-on-dark
    if not contours or cv2.contourArea(max(contours, key=cv2.contourArea)) < 50:
        _, thresh = cv2.threshold(blur, threshold, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    largest = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest)
    if area < 50:
        return None
    M = cv2.moments(largest)
    if M["m00"] == 0:
        return None
    cx = int(M["m10"] / M["m00"])
    cy = int(M["m01"] / M["m00"])
    return cx, cy, area

def detect_arena_type(cap, info):
    """Auto-detect arena shape from first frame"""
    ret, frame = cap.read()
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    if not ret:
        return "unknown"
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (15, 15), 0)
    edges = cv2.Canny(blur, 30, 100)
    # Check for circle (MWM pool)
    circles = cv2.HoughCircles(blur, cv2.HOUGH_GRADIENT, 1, 100,
        param1=50, param2=30, minRadius=50,
        maxRadius=max(info["width"], info["height"]) // 2)
    if circles is not None:
        return "circular"
    # Check for Y shape (3 arms)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest = max(contours, key=cv2.contourArea)
        hull = cv2.convexHull(largest)
        area = cv2.contourArea(largest)
        hull_area = cv2.contourArea(hull)
        solidity = area / hull_area if hull_area > 0 else 0
        if solidity < 0.6:
            return "ymaze"
    return "square"

def normalize_pos(cx, cy, width, height, canvas=600):
    return {
        "x": int((cx / width)  * canvas),
        "y": int((cy / height) * canvas)
    }

def calc_distance(positions):
    dist = 0
    for i in range(1, len(positions)):
        dx = positions[i]["x"] - positions[i-1]["x"]
        dy = positions[i]["y"] - positions[i-1]["y"]
        dist += np.sqrt(dx**2 + dy**2)
    return round(dist * 0.042, 2)

def calc_speed(positions, fps=30):
    speeds = []
    for i in range(1, len(positions)):
        dx = positions[i]["x"] - positions[i-1]["x"]
        dy = positions[i]["y"] - positions[i-1]["y"]
        speeds.append(np.sqrt(dx**2 + dy**2) * 0.042 * fps)
    return speeds

# ─── HEALTH ───────────────────────────────────────────────────────────────────

@app.route("/")
def health():
    return jsonify({
        "message":   "NeuroMatrix Biosystems server running",
        "status":    "ok",
        "cv2":       cv2.__version__,
        "endpoints": ["/process", "/process/mwm", "/process/ymaze", "/process/oft", "/process/auto"]
    })

# ─── ORIGINAL /process (App.js MWM video upload) ─────────────────────────────

@app.route("/process", methods=["POST"])
def process():
    if "video" not in request.files:
        return jsonify({"error": "No video file received"}), 400
    temp = save_temp(request.files["video"])
    try:
        cap  = open_video(temp)
        if not cap:
            return jsonify({"error": "Cannot open video"}), 400
        info = get_video_info(cap)
        positions = []
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret: break
            frame_count += 1
            if frame_count % 2 != 0: continue
            result = detect_subject(frame)
            if result:
                cx, cy, _ = result
                positions.append(normalize_pos(cx, cy, info["width"], info["height"]))
        cap.release()
        return jsonify({
            "positions":    positions,
            "total_frames": len(positions),
            "status":       "success"
        })
    except Exception as e:
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500
    finally:
        if os.path.exists(temp): os.remove(temp)

# ─── MWM ─────────────────────────────────────────────────────────────────────

@app.route("/process/mwm", methods=["POST"])
def process_mwm():
    if "video" not in request.files:
        return jsonify({"error": "No video file received"}), 400
    temp = save_temp(request.files["video"], "temp_mwm.mp4")
    try:
        cap  = open_video(temp)
        if not cap:
            return jsonify({"error": "Cannot open video"}), 400
        info = get_video_info(cap)
        fps  = info["fps"]
        W, H = info["width"], info["height"]
        cx_arena, cy_arena = W // 2, H // 2
        radius  = min(W, H) // 2
        plat_x  = int(cx_arena + radius * 0.6)
        plat_y  = int(cy_arena - radius * 0.6)
        plat_r  = int(radius * 0.08)
        positions       = []
        quadrant_frames = {"Target": 0, "Opposite": 0, "Left": 0, "Right": 0}
        platform_frames = 0
        frame_count     = 0
        start_time      = None
        escape_time     = None

        while True:
            ret, frame = cap.read()
            if not ret: break
            frame_count += 1
            t = frame_count / fps
            result = detect_subject(frame)
            if not result: continue
            rx, ry, _ = result
            pos = normalize_pos(rx, ry, W, H)
            positions.append(pos)
            if start_time is None:
                start_time = t
            nx, ny = pos["x"], pos["y"]
            if   nx > 300 and ny < 300: quadrant_frames["Target"]   += 1
            elif nx < 300 and ny > 300: quadrant_frames["Opposite"] += 1
            elif nx < 300 and ny < 300: quadrant_frames["Left"]     += 1
            else:                       quadrant_frames["Right"]    += 1
            dist_plat = np.sqrt((rx - plat_x)**2 + (ry - plat_y)**2)
            if dist_plat < plat_r:
                platform_frames += 1
                if escape_time is None:
                    escape_time = t - (start_time or 0)

        cap.release()
        total_frames = len(positions)
        duration  = total_frames / fps if fps > 0 else 0
        distance  = calc_distance(positions)
        speeds    = calc_speed(positions, fps)
        avg_speed = round(np.mean(speeds), 3) if speeds else 0
        max_speed = round(np.max(speeds),  3) if speeds else 0
        total_q   = sum(quadrant_frames.values()) or 1
        quadrant_pct = {k: round(v / total_q * 100, 1) for k, v in quadrant_frames.items()}

        return jsonify({
            "positions":      positions,
            "total_frames":   total_frames,
            "duration_sec":   round(duration, 2),
            "escape_latency": round(escape_time, 2) if escape_time else round(duration, 2),
            "distance_m":     distance,
            "avg_speed":      avg_speed,
            "max_speed":      max_speed,
            "quadrant_pct":   quadrant_pct,
            "platform_pct":   round(platform_frames / total_q * 100, 1),
            "arena_type":     "circular",
            "status":         "success"
        })
    except Exception as e:
        print(f"[MWM] ERROR: {traceback.format_exc()}")
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500
    finally:
        if os.path.exists(temp): os.remove(temp)

# ─── Y-MAZE ───────────────────────────────────────────────────────────────────

@app.route("/process/ymaze", methods=["POST"])
def process_ymaze():
    if "video" not in request.files:
        return jsonify({"error": "No video file received"}), 400
    temp = save_temp(request.files["video"], "temp_ymaze.mp4")
    try:
        cap  = open_video(temp)
        if not cap:
            return jsonify({"error": "Cannot open video"}), 400
        info = get_video_info(cap)
        fps  = info["fps"]
        W, H = info["width"], info["height"]
        arms = {
            "A": {"cx": W // 2,       "cy": int(H * 0.15)},
            "B": {"cx": int(W * 0.2), "cy": int(H * 0.8)},
            "C": {"cx": int(W * 0.8), "cy": int(H * 0.8)},
        }
        arm_radius   = min(W, H) // 4
        positions    = []
        arm_sequence = []
        arm_time     = {"A": 0, "B": 0, "C": 0, "center": 0}
        current_arm  = None
        frame_count  = 0

        while True:
            ret, frame = cap.read()
            if not ret: break
            frame_count += 1
            if frame_count % 2 != 0: continue
            result = detect_subject(frame)
            if not result: continue
            rx, ry, _ = result
            positions.append(normalize_pos(rx, ry, W, H))
            detected_arm = None
            min_dist     = float("inf")
            for arm, center in arms.items():
                d = np.sqrt((rx - center["cx"])**2 + (ry - center["cy"])**2)
                if d < arm_radius and d < min_dist:
                    min_dist     = d
                    detected_arm = arm
            if detected_arm and detected_arm != current_arm:
                arm_sequence.append(detected_arm)
                current_arm = detected_arm
            if detected_arm:
                arm_time[detected_arm] += 1 / fps
            else:
                arm_time["center"] += 1 / fps

        cap.release()
        alternations  = 0
        if len(arm_sequence) >= 3:
            for i in range(len(arm_sequence) - 2):
                if len(set(arm_sequence[i:i+3])) == 3:
                    alternations += 1
        total_entries = len(arm_sequence)
        alt_pct = round((alternations / (total_entries - 2)) * 100, 1) if total_entries > 2 else 0

        return jsonify({
            "positions":       positions,
            "total_frames":    len(positions),
            "total_entries":   total_entries,
            "alternations":    alternations,
            "alternation_pct": alt_pct,
            "arm_sequence":    arm_sequence,
            "arm_time":        {k: round(v, 2) for k, v in arm_time.items()},
            "arena_type":      "ymaze",
            "status":          "success"
        })
    except Exception as e:
        print(f"[YMaze] ERROR: {traceback.format_exc()}")
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500
    finally:
        if os.path.exists(temp): os.remove(temp)

# ─── OFT ──────────────────────────────────────────────────────────────────────

@app.route("/process/oft", methods=["POST"])
def process_oft():
    if "video" not in request.files:
        return jsonify({"error": "No video file received"}), 400
    temp = save_temp(request.files["video"], "temp_oft.mp4")
    try:
        cap  = open_video(temp)
        if not cap:
            return jsonify({"error": "Cannot open video"}), 400
        info = get_video_info(cap)
        fps  = info["fps"]
        W, H = info["width"], info["height"]
        center_x1 = int(W * 0.3)
        center_x2 = int(W * 0.7)
        center_y1 = int(H * 0.3)
        center_y2 = int(H * 0.7)
        positions        = []
        center_frames    = 0
        periphery_frames = 0
        freezing_frames  = 0
        rearing_events   = 0
        speeds           = []
        prev_pos         = None
        prev_area        = None
        freeze_thresh    = 2.0
        rearing_thresh   = 0.3
        frame_count      = 0

        while True:
            ret, frame = cap.read()
            if not ret: break
            frame_count += 1
            if frame_count % 2 != 0: continue
            result = detect_subject(frame)
            if not result: continue
            rx, ry, area = result
            pos = normalize_pos(rx, ry, W, H)
            positions.append(pos)
            if center_x1 < rx < center_x2 and center_y1 < ry < center_y2:
                center_frames += 1
            else:
                periphery_frames += 1
            if prev_pos:
                dx  = rx - prev_pos[0]
                dy  = ry - prev_pos[1]
                spd = np.sqrt(dx**2 + dy**2) * 0.042 * fps
                speeds.append(spd)
                if spd < freeze_thresh:
                    freezing_frames += 1
            if prev_area and area > 0 and prev_area > 0:
                if area / prev_area > (1 + rearing_thresh):
                    rearing_events += 1
            prev_pos  = (rx, ry)
            prev_area = area

        cap.release()
        total    = len(positions) or 1
        duration = total / fps if fps > 0 else 0
        distance  = calc_distance(positions)
        avg_speed = round(float(np.mean(speeds)), 3) if speeds else 0
        max_speed = round(float(np.max(speeds)),  3) if speeds else 0

        return jsonify({
            "positions":      positions,
            "total_frames":   total,
            "duration_sec":   round(duration, 2),
            "distance_m":     distance,
            "avg_speed":      avg_speed,
            "max_speed":      max_speed,
            "center_time":    round(center_frames    / fps, 2),
            "periphery_time": round(periphery_frames / fps, 2),
            "center_pct":     round(center_frames    / total * 100, 1),
            "periphery_pct":  round(periphery_frames / total * 100, 1),
            "freezing_time":  round(freezing_frames  / fps, 2),
            "freezing_pct":   round(freezing_frames  / total * 100, 1),
            "rearing_events": rearing_events,
            "arena_type":     "square",
            "status":         "success"
        })
    except Exception as e:
        print(f"[OFT] ERROR: {traceback.format_exc()}")
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500
    finally:
        if os.path.exists(temp): os.remove(temp)

# ─── AUTO-DETECT ──────────────────────────────────────────────────────────────

@app.route("/process/auto", methods=["POST"])
def process_auto():
    """Smart auto-detect arena type from video"""
    if "video" not in request.files:
        return jsonify({"error": "No video file received"}), 400
    temp = save_temp(request.files["video"], "temp_auto.mp4")
    try:
        cap   = open_video(temp)
        if not cap:
            return jsonify({"error": "Cannot open video"}), 400
        info  = get_video_info(cap)
        arena = detect_arena_type(cap, info)
        cap.release()
        print(f"[Auto] Detected arena: {arena}")
        mapping = {
            "circular": ("mwm",   "Circular arena detected — Morris Water Maze"),
            "ymaze":    ("ymaze", "Y-shaped arena detected — Y-Maze"),
            "square":   ("oft",   "Square arena detected — Open Field Test"),
        }
        test, message = mapping.get(arena, ("mwm", "Unknown arena — defaulting to MWM"))
        return jsonify({
            "detected_arena": arena,
            "suggested_test": test,
            "message":        message,
            "status":         "success"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp): os.remove(temp)

# ─── RUN ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[Server] NeuroMatrix Biosystems starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
