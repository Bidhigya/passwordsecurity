import re
import hashlib
import requests
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


def check_pwned_password(password: str):
    """
    Check if password has appeared in known breaches using HaveIBeenPwned k-Anonymity API.
    Returns:
        int: number of times breached
        0: not breached
        None: API error or timeout
    """
    if not password:
        return 0

    # Convert password to SHA-1 hash locally
    sha1_password = hashlib.sha1(
        password.encode("utf-8")
    ).hexdigest().upper()

    # Only send first 5 characters of the hash (k-Anonymity)
    prefix = sha1_password[:5]
    suffix = sha1_password[5:]

    url = f"https://api.pwnedpasswords.com/range/{prefix}"

    try:
        response = requests.get(
            url,
            headers={"Add-Padding": "true", "User-Agent": "Password-Checker-App"},
            timeout=5
        )

        # Check if API request was successful
        if response.status_code != 200:
            return None

        # Search returned hash suffixes
        for line in response.text.splitlines():
            parts = line.split(":")
            if len(parts) >= 2:
                hash_suffix, count = parts[0].strip(), parts[1].strip()
                if hash_suffix == suffix:
                    return int(count)

        # Password hash was not found
        return 0

    except requests.RequestException:
        return None


def check_password(password: str):
    """
    Check password strength, security score, feedback, and breach status.
    """
    score = 0
    feedback = []

    # Individual criteria checks for UI highlights
    criteria = {
        "length": len(password) >= 10,
        "uppercase": bool(re.search(r"[A-Z]", password)),
        "lowercase": bool(re.search(r"[a-z]", password)),
        "number": bool(re.search(r"\d", password)),
        "special": bool(re.search(r"""[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/'`;~]""", password)),
        "not_common": True,
        "no_repeats": not bool(re.search(r"(.)\1{2,}", password)),
        "no_sequences": not any(
            seq in password
            for seq in ["123", "234", "345", "456", "567", "678", "789"]
        ),
    }

    # Check password length
    if criteria["length"]:
        score += 1
    else:
        feedback.append("Use at least 10 characters.")

    # Check uppercase letters
    if criteria["uppercase"]:
        score += 1
    else:
        feedback.append("Add at least one uppercase letter.")

    # Check lowercase letters
    if criteria["lowercase"]:
        score += 1
    else:
        feedback.append("Add at least one lowercase letter.")

    # Check numbers
    if criteria["number"]:
        score += 1
    else:
        feedback.append("Add at least one number.")

    # Check special characters
    if criteria["special"]:
        score += 1
    else:
        feedback.append("Add at least one special character.")

    # Check common passwords
    common_passwords = {
        "password",
        "password123",
        "123456",
        "12345678",
        "123456789",
        "1234567890",
        "qwerty",
        "qwerty123",
        "admin",
        "admin123",
        "letmein",
        "welcome",
        "abc123",
        "iloveyou",
        "monkey",
        "dragon",
        "football",
        "hello123"
    }

    if password.lower() in common_passwords:
        criteria["not_common"] = False
        score = max(0, score - 2)
        feedback.append("This is a commonly used password.")

    # Check repeated characters
    if not criteria["no_repeats"]:
        score = max(0, score - 1)
        feedback.append("Avoid repeating the same character multiple times.")

    # Check sequential numbers
    if not criteria["no_sequences"]:
        score = max(0, score - 1)
        feedback.append("Avoid predictable number sequences.")

    # Check password against breach database
    breach_count = check_pwned_password(password)

    if breach_count is None:
        feedback.append("Could not check the password breach database.")
        breach_status = "unavailable"
    elif breach_count > 0:
        score = max(0, score - 2)
        feedback.append(
            f"WARNING: This password has appeared in known data breaches {breach_count:,} times. Do not use this password."
        )
        breach_status = "Not safe"
    else:
        breach_status = "safe"

    # Clamp score between 0 and 5
    score = max(0, min(5, score))

    # Determine password strength
    if score <= 2:
        strength = "WEAK"
    elif score <= 4:
        strength = "MEDIUM"
    else:
        strength = "STRONG"

    return {
        "strength": strength,
        "score": score,
        "max_score": 5,
        "feedback": feedback,
        "breach_count": breach_count,
        "breach_status": breach_status,
        "criteria": criteria,
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/check", methods=["POST"])
def check_password_api():
    data = request.get_json(silent=True) or {}
    password = data.get("password", "")

    if not isinstance(password, str) or not password:
        return jsonify({
            "error": "Password cannot be empty."
        }), 400

    result = check_password(password)
    return jsonify(result)


if __name__ == "__main__":
    print("=" * 55)
    print("🔒 Password Security Checker running at http://127.0.0.1:5001")
    print("=" * 55)
    app.run(host="0.0.0.0", port=5001, debug=True)