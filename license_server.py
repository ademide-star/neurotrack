"""
NeuroMatrix Biosystems — License Key Backend
============================================
Handles license generation, verification, Paystack webhooks and .exe downloads.

Deploy on Render.com (free tier) as a separate service from server.py

Requirements:
  pip install flask flask-cors requests python-dotenv cryptography
"""

import os
import json
import hmac
import uuid
import hashlib
import secrets
import smtplib
import logging
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps

from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS

# ── Setup ─────────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=["*"])

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# ── Config (set these as environment variables on Render) ─────────────────────
PAYSTACK_SECRET      = os.environ.get("PAYSTACK_SECRET_KEY", "sk_test_REPLACE")
EMAIL_HOST           = os.environ.get("EMAIL_HOST",           "smtp.gmail.com")
EMAIL_PORT           = int(os.environ.get("EMAIL_PORT",       "587"))
EMAIL_USER           = os.environ.get("EMAIL_USER",           "neuromatrixbiosystems@gmail.com")
EMAIL_PASS           = os.environ.get("EMAIL_PASS",           "your_app_password")
ADMIN_EMAIL          = os.environ.get("ADMIN_EMAIL",          "neuromatrixbiosystems@gmail.com")
DOWNLOAD_URL         = os.environ.get("DOWNLOAD_URL",         "https://your-download-link.com/neurotrack-setup.exe")
ADMIN_SECRET         = os.environ.get("ADMIN_SECRET",         "change-this-secret")

# ── In-memory license store (replace with DB on production) ───────────────────
# Structure: { "NMBT-XXXX-XXXX-XXXX": { ...license data... } }
LICENSE_DB = {}

# ── Plan definitions ──────────────────────────────────────────────────────────
PLANS = {
    "student": {
        "name":          "Student License",
        "seats":         1,
        "ngn":           49000,
        "usd":           29,
        "features":      ["mwm_basic", "trajectory", "csv_export"],
        "upgrade_years": None,
    },
    "researcher": {
        "name":          "Researcher License",
        "seats":         1,
        "ngn":           79000,
        "usd":           49,
        "features":      ["mwm_full", "ymaze", "oft", "heatmap", "png_export",
                          "probe_trial", "learning_curve", "trajectory", "csv_export"],
        "upgrade_years": 1,
    },
    "institution": {
        "name":          "Institution License",
        "seats":         5,
        "ngn":           149000,
        "usd":           89,
        "features":      ["mwm_full", "ymaze", "oft", "heatmap", "png_export",
                          "probe_trial", "learning_curve", "trajectory", "csv_export",
                          "multi_seat", "api_access", "custom_branding"],
        "upgrade_years": None,  # lifetime
    },
}

# ── Utils ──────────────────────────────────────────────────────────────────────

def generate_license_key(plan: str) -> str:
    """Generate a unique license key: NMBT-XXXX-XXXX-XXXX"""
    prefix = "NMBT"
    parts  = [secrets.token_hex(2).upper() for _ in range(3)]
    return f"{prefix}-{parts[0]}-{parts[1]}-{parts[2]}"

def verify_paystack_signature(payload: bytes, signature: str) -> bool:
    """Verify Paystack webhook signature"""
    expected = hmac.new(
        PAYSTACK_SECRET.encode("utf-8"),
        payload,
        hashlib.sha512
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

def send_license_email(email: str, name: str, plan: str, license_key: str):
    """Send license key email to buyer"""
    plan_info = PLANS.get(plan, {})
    subject   = f"🧠 Your NeuroTrack Pro License Key — {plan_info.get('name', plan)}"

    html = f"""
<!DOCTYPE html>
<html>
<body style="background:#070b16;color:#e2e8f0;font-family:'Courier New',monospace;padding:40px;max-width:600px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="font-size:32px;">🧠</div>
    <h1 style="color:#c9a84c;font-size:20px;letter-spacing:0.15em;margin:8px 0;">NEUROMATRIX BIOSYSTEMS</h1>
    <p style="color:#4a5568;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;">NeuroTrack Pro</p>
  </div>

  <div style="background:#0d1428;border:1px solid #1e2a4a;border-radius:12px;padding:32px;margin-bottom:24px;">
    <p style="color:#4a5568;font-size:11px;margin-bottom:8px;">Dear {name},</p>
    <p style="font-size:12px;line-height:1.8;color:#e2e8f0;margin-bottom:24px;">
      Thank you for purchasing <strong style="color:#c9a84c;">NeuroTrack Pro — {plan_info.get('name', plan)}</strong>.
      Your perpetual license key is below.
    </p>

    <div style="background:#070b16;border:2px solid #c9a84c66;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#4a5568;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;">Your License Key</p>
      <p style="color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:0.15em;">{license_key}</p>
    </div>

    <h3 style="color:#c9a84c;font-size:12px;letter-spacing:0.1em;margin-bottom:12px;">HOW TO ACTIVATE:</h3>
    <ol style="color:#4a5568;font-size:11px;line-height:2;padding-left:20px;">
      <li>Go to <a href="https://neuromatrixbiosystems.com/pricing" style="color:#c9a84c;">neuromatrixbiosystems.com/pricing</a></li>
      <li>Scroll to <strong style="color:#e2e8f0;">"Already have a license?"</strong></li>
      <li>Enter your key and click <strong style="color:#e2e8f0;">Verify</strong></li>
      <li>Access the web app or download the desktop .exe</li>
    </ol>

    <h3 style="color:#c9a84c;font-size:12px;letter-spacing:0.1em;margin:20px 0 12px;">YOUR PLAN INCLUDES:</h3>
    <ul style="color:#4a5568;font-size:11px;line-height:2;padding-left:20px;">
      {"".join(f"<li style='color:#00f5c4;'>✓ {f.replace('_',' ').title()}</li>" for f in plan_info.get('features', []))}
      <li style="color:#00f5c4;">✓ {plan_info.get('seats', 1)} seat(s)</li>
      <li style="color:#00f5c4;">✓ Web app + Desktop .exe</li>
    </ul>
  </div>

  <div style="background:#0d1428;border:1px solid #1e2a4a;border-radius:8px;padding:20px;margin-bottom:24px;">
    <p style="color:#4a5568;font-size:10px;line-height:1.8;">
      💡 <strong style="color:#e2e8f0;">Keep this email safe</strong> — your license key is permanent.<br/>
      🔬 For support: <a href="mailto:neuromatrixbiosystems@gmail.com" style="color:#c9a84c;">neuromatrixbiosystems@gmail.com</a><br/>
      🌐 Website: <a href="https://neuromatrixbiosystems.com" style="color:#c9a84c;">neuromatrixbiosystems.com</a>
    </p>
  </div>

  <p style="text-align:center;color:#2d3748;font-size:9px;letter-spacing:0.1em;">
    © 2026 NeuroMatrix Biosystems · University of Ilorin · GRASP/NIH/DSI Program
  </p>
</body>
</html>
"""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = EMAIL_USER
        msg["To"]      = email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, [email, ADMIN_EMAIL], msg.as_string())

        log.info(f"[Email] Sent license to {email}")
        return True
    except Exception as e:
        log.error(f"[Email] Failed: {e}")
        return False

# ── ROUTES ────────────────────────────────────────────────────────────────────

@app.route("/")
def health():
    return jsonify({
        "service": "NeuroMatrix License Server",
        "status":  "ok",
        "version": "1.0.0",
        "licenses_issued": len(LICENSE_DB),
    })

# ── Paystack webhook ──────────────────────────────────────────────────────────

@app.route("/webhook/paystack", methods=["POST"])
def paystack_webhook():
    """Receives Paystack payment confirmation — generates and emails license key"""
    payload   = request.get_data()
    signature = request.headers.get("X-Paystack-Signature", "")

    if not verify_paystack_signature(payload, signature):
        log.warning("[Webhook] Invalid Paystack signature")
        return jsonify({"error": "Invalid signature"}), 401

    try:
        event = json.loads(payload)
        log.info(f"[Webhook] Event: {event.get('event')}")

        if event.get("event") != "charge.success":
            return jsonify({"status": "ignored"}), 200

        data     = event["data"]
        email    = data["customer"]["email"]
        amount   = data["amount"] / 100  # convert from kobo
        ref      = data["reference"]
        metadata = data.get("metadata", {})
        fields   = {f["variable_name"]: f["value"] for f in metadata.get("custom_fields", [])}

        name        = fields.get("buyer_name", "Researcher")
        institution = fields.get("institution", "")
        plan_key    = _detect_plan_from_amount(amount)

        log.info(f"[Webhook] Payment: {email} | {plan_key} | ₦{amount} | ref:{ref}")

        # Generate license key
        license_key = generate_license_key(plan_key)
        while license_key in LICENSE_DB:
            license_key = generate_license_key(plan_key)

        # Store license
        LICENSE_DB[license_key] = {
            "key":         license_key,
            "email":       email,
            "name":        name,
            "institution": institution,
            "plan":        plan_key,
            "features":    PLANS[plan_key]["features"],
            "seats":       PLANS[plan_key]["seats"],
            "created_at":  datetime.utcnow().isoformat(),
            "ref":         ref,
            "active":      True,
            "activations": [],
        }

        log.info(f"[License] Generated: {license_key} for {email}")

        # Send email
        email_sent = send_license_email(email, name, plan_key, license_key)
        log.info(f"[Email] Sent: {email_sent}")

        return jsonify({
            "status":      "success",
            "license_key": license_key,
            "email_sent":  email_sent,
        }), 200

    except Exception as e:
        log.error(f"[Webhook] Error: {e}")
        return jsonify({"error": str(e)}), 500

def _detect_plan_from_amount(amount: float) -> str:
    """Detect plan from payment amount"""
    if amount >= 149000:  return "institution"
    if amount >= 79000:   return "researcher"
    return "student"

# ── Verify license ────────────────────────────────────────────────────────────

@app.route("/verify", methods=["POST"])
def verify_license():
    """Verify a license key — called by App.js on load"""
    data = request.get_json()
    key  = data.get("key", "").strip().upper()

    if not key:
        return jsonify({"valid": False, "error": "No key provided"}), 400

    license = LICENSE_DB.get(key)

    if not license:
        return jsonify({"valid": False, "error": "License not found"}), 404

    if not license.get("active"):
        return jsonify({"valid": False, "error": "License deactivated"}), 403

    # Track activation
    ip = request.remote_addr
    if ip not in license["activations"]:
        if len(license["activations"]) >= license["seats"]:
            return jsonify({
                "valid":  False,
                "error":  f"Seat limit reached ({license['seats']} seats). Contact support to add more.",
            }), 403
        license["activations"].append(ip)

    return jsonify({
        "valid":    True,
        "plan":     license["plan"],
        "features": license["features"],
        "seats":    license["seats"],
        "name":     license["name"],
        "email":    license["email"],
    }), 200

# ── Download .exe ─────────────────────────────────────────────────────────────

@app.route("/download", methods=["POST"])
def download_exe():
    """Return download link after license verification"""
    data = request.get_json()
    key  = data.get("key", "").strip().upper()
    license = LICENSE_DB.get(key)

    if not license or not license.get("active"):
        return jsonify({"error": "Invalid or inactive license"}), 403

    # Return signed download URL
    # In production: generate a signed S3/Cloudflare URL
    return jsonify({
        "download_url": DOWNLOAD_URL,
        "expires_in":   "1 hour",
        "version":      "2.1.0",
        "filename":     "NeuroTrack-Pro-Setup.exe",
    }), 200

# ── Admin routes ──────────────────────────────────────────────────────────────

def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        secret = request.headers.get("X-Admin-Secret", "")
        if secret != ADMIN_SECRET:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route("/admin/licenses", methods=["GET"])
@require_admin
def list_licenses():
    """List all licenses — admin only"""
    return jsonify({
        "total":    len(LICENSE_DB),
        "licenses": list(LICENSE_DB.values()),
    }), 200

@app.route("/admin/generate", methods=["POST"])
@require_admin
def admin_generate():
    """Manually generate a license key — for bank transfers"""
    data  = request.get_json()
    email = data.get("email")
    name  = data.get("name", "Researcher")
    plan  = data.get("plan", "researcher")

    if not email or plan not in PLANS:
        return jsonify({"error": "Invalid email or plan"}), 400

    license_key = generate_license_key(plan)
    while license_key in LICENSE_DB:
        license_key = generate_license_key(plan)

    LICENSE_DB[license_key] = {
        "key":         license_key,
        "email":       email,
        "name":        name,
        "institution": data.get("institution", ""),
        "plan":        plan,
        "features":    PLANS[plan]["features"],
        "seats":       PLANS[plan]["seats"],
        "created_at":  datetime.utcnow().isoformat(),
        "ref":         "MANUAL-" + secrets.token_hex(4).upper(),
        "active":      True,
        "activations": [],
    }

    email_sent = send_license_email(email, name, plan, license_key)

    return jsonify({
        "license_key": license_key,
        "email_sent":  email_sent,
        "plan":        plan,
    }), 200

@app.route("/admin/revoke", methods=["POST"])
@require_admin
def revoke_license():
    """Revoke a license key"""
    key     = request.get_json().get("key", "").upper()
    license = LICENSE_DB.get(key)
    if not license:
        return jsonify({"error": "License not found"}), 404
    license["active"] = False
    return jsonify({"revoked": key}), 200

@app.route("/admin/stats", methods=["GET"])
@require_admin
def stats():
    """Dashboard stats"""
    plans_count = {}
    for lic in LICENSE_DB.values():
        p = lic["plan"]
        plans_count[p] = plans_count.get(p, 0) + 1

    revenue = sum(
        PLANS[lic["plan"]]["ngn"]
        for lic in LICENSE_DB.values()
        if lic.get("active")
    )

    return jsonify({
        "total_licenses": len(LICENSE_DB),
        "active":         sum(1 for l in LICENSE_DB.values() if l.get("active")),
        "by_plan":        plans_count,
        "total_revenue_ngn": revenue,
        "total_revenue_usd": sum(
            PLANS[lic["plan"]]["usd"]
            for lic in LICENSE_DB.values()
            if lic.get("active")
        ),
    }), 200

# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    log.info(f"[License Server] Starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
