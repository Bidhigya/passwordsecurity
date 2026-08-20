# 🔒 CyberGuard - Password Security & Breach Checker

A modern, responsive Flask web application that evaluates password strength and queries the HaveIBeenPwned API using privacy-preserving k-Anonymity SHA-1 hash prefixes.

## 🌟 Features

- **Cybersecurity-Themed Dark UI**: Glassmorphic styling, glowing neon accents, and responsive layout.
- **Security Score & Strength Meter**: 0–5 numerical score with dynamic Weak / Medium / Strong visual gauges.
- **k-Anonymity Breach Detection**: Checks the password against billions of exposed breach records via HaveIBeenPwned range API without transmitting the raw password or complete hash.
- **Interactive Security Checklist**: Real-time breakdown of length, character variety, common password dictionaries, character repetitions, and sequential patterns.
- **Show / Hide Password Toggle**: Inspect or mask password input with smooth icon transitions.
- **Zero Storage / Logging**: Passwords are never saved, persisted, or logged to disk or console.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Application
```bash
python3 app.py
```

### 3. Open in Browser
Visit **[http://localhost:5001](http://localhost:5001)** in your web browser.

---

## 📁 Project Structure

```
password-checker/
├── app.py              # Flask backend & evaluation logic
├── requirements.txt    # Python dependencies
├── README.md           # Documentation
├── static/
│   ├── style.css       # Cybersecurity dark theme styling
│   └── script.js       # Vanilla JS fetch API handler & UI manager
└── templates/
    └── index.html      # Responsive HTML5 layout
```
