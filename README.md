# 🛡️ VoiceShield AI – Real-Time Voice Cloning Impersonation Detection

<p align="center">

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-Backend-black?logo=flask)
![Librosa](https://img.shields.io/badge/Librosa-Audio%20Processing-purple)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Machine%20Learning-orange?logo=scikitlearn)
![Cybersecurity](https://img.shields.io/badge/Domain-Cybersecurity-red)
![Status](https://img.shields.io/badge/Status-Prototype-blue)

</p>

---

# 🌐 Live Demo

### Interactive Frontend

https://voiceshieldai-frontend.onrender.com/

### Backend API

https://voiceshieldai-wlso.onrender.com

The frontend provides an interactive demonstration of VoiceShield AI's voice analysis and security-risk assessment workflow. The backend hosts the audio-analysis API.

> **Note:** Live audio analysis is currently under debugging. Some analysis requests may time out, so successful end-to-end operation is not yet guaranteed.

---

# 📌 Project Overview

VoiceShield AI is a cybersecurity-focused system designed to detect potential voice-cloning and synthetic voice impersonation attacks.

With the increasing accessibility of AI-powered voice generation, attackers can imitate trusted individuals, executives, family members, and authorized personnel to manipulate victims into transferring money or revealing sensitive information.

VoiceShield AI combines audio signal processing, machine learning, and context-aware risk assessment to help identify suspicious voice samples and evaluate potentially fraudulent interactions.

The system aims to support security scenarios involving:

- AI-generated voice impersonation
- Executive and CEO fraud
- Social engineering attacks
- Fraudulent financial transaction requests
- Unauthorized requests for confidential information
- Suspicious calls involving urgency or impersonated authority

---

# 🚀 Key Features

### 🎙️ Audio Analysis

Processes audio samples and extracts acoustic, spectral, and prosodic characteristics for machine learning inference.

### 🤖 Machine Learning-Based Detection

Uses trained Support Vector Machine and Logistic Regression models to classify voice samples based on extracted audio features.

### 🔬 Audio Feature Engineering

Extracts 53 features, including:

- Mel-Frequency Cepstral Coefficients (MFCC)
- Root Mean Square (RMS) energy
- Zero Crossing Rate (ZCR)
- Spectral centroid
- Spectral bandwidth
- Spectral rolloff
- Spectral contrast
- Pitch statistics and voiced-frame ratio

### 🛡️ Context-Aware Risk Assessment

Combines voice-analysis results with contextual signals such as caller identity, claimed authority, transaction amount, urgency, and requests for sensitive information.

### 📊 Risk Scoring

Uses a weighted risk engine to produce a risk score and classify interactions into four levels:

| Risk Level | Score |
|---|---:|
| LOW | 0–24 |
| MEDIUM | 25–49 |
| HIGH | 50–74 |
| CRITICAL | 75–100 |

### 🚨 Security Response Recommendations

Maps risk levels to proposed security responses, including allowing an interaction, issuing a warning, requesting secondary verification, or blocking/escalating a suspicious interaction.

> These responses are prototype recommendations; automatic blocking of real calls is not implemented.

### 🖥️ Interactive Security Dashboard

Provides a dark-themed web interface with Overview, Voice Analysis, Security Report, and Live Protection sections.

Live Protection is intended as a demonstration and future-development area, not a verified live-call monitoring capability.

---

# 🧠 Model Performance

The following are the recorded evaluation results for the trained models.

## Support Vector Machine (SVM)

| Metric | Value |
|---|---:|
| Accuracy | **99.63%** |
| Precision | **99.72%** |
| Recall | **99.87%** |
| F1 Score | **99.79%** |
| ROC–AUC | **0.9995** |

## Logistic Regression

| Metric | Value |
|---|---:|
| Accuracy | **97.42%** |
| Precision | **97.48%** |
| Recall | **99.71%** |
| F1 Score | **98.58%** |
| ROC–AUC | **0.9861** |

### Evaluation Notes

These metrics represent the recorded model evaluation results on the project's test data. They should not be interpreted as guaranteed real-world fraud-detection accuracy.

Performance in live calls may differ because of background noise, compression, language, speaker variation, unseen synthesis techniques, and differences between training and deployment data.

---

# 🔎 System Workflow

1. User uploads an audio sample through the web interface.
2. The frontend sends the audio to the Flask backend.
3. Audio preprocessing prepares the waveform for analysis.
4. Acoustic, spectral, and prosodic features are extracted.
5. The trained voice-detection models generate predictions.
6. The voice-analysis components return their results to the unified analysis pipeline.
7. Contextual information is evaluated by the risk engine.
8. A combined risk score and risk category are generated.
9. The interface presents the analysis results and recommended security response.

**Current limitation:** The deployed end-to-end analysis pipeline is still under debugging and may time out during feature extraction.

---

# 🏗️ Technology Stack

## Machine Learning and Audio Processing

- Python 3.11
- NumPy
- Pandas
- Librosa
- SoundFile
- SciPy
- Scikit-Learn
- Joblib

## Backend

- Flask
- Flask-CORS
- Gunicorn
- Python-based audio-processing and inference modules

## Frontend

- HTML5
- CSS3
- JavaScript

## Deployment and Development

- Git and GitHub
- Render
- Visual Studio Code
- Python virtual environments

---

# 📂 Project Structure

```text
VoiceShield_AI/
│
├── audio/
│   ├── analyzer.py
│   ├── features.py
│   └── preprocessing.py
│
├── backend/
│   ├── app.py
│   ├── routes/
│   │   └── analyze.py
│   └── services/
│       └── voice_analysis.py
│
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── config.js
│
├── group1/
│   └── analyzer.py
│
├── inference/
│   ├── unified_analyzer.py
│   └── svm_detector.py
│
├── member1_preprocessing/
│   └── audio_loader.py
│
├── models/
│   ├── svm_voice_detector.pkl
│   ├── svm_scaler.pkl
│   ├── logistic_regression_detector.pkl
│   └── logistic_regression_scaler.pkl
│
├── requirements.txt
├── .gitignore
└── README.md
```

*The structure above highlights the main project components; filenames and additional modules may vary as the repository evolves.*

---

# ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Jashwanth0533R/VoiceShieldAI.git
cd VoiceShieldAI
```

### 2. Create and activate a virtual environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the backend

```bash
python -m backend.app
```

The backend should be available at:

```text
http://127.0.0.1:5000
```

### 5. Start the frontend

Open another terminal:

```powershell
cd frontend
python -m http.server 8080
```

Open the interface at:

```text
http://127.0.0.1:8080
```

Ensure the frontend API configuration points to your local backend when testing locally.

---

# 🌱 Future Scope

- Real-time voice-cloning detection in live calls
- Streaming audio analysis
- Caller identity verification
- Integration with telephony systems
- Adaptive detection against unseen voice-cloning models
- Noise-robust feature extraction
- Improved inference latency and resource efficiency
- Secondary authentication for high-risk transactions
- Integration with fraud-reporting and security platforms
- Expanded evaluation on diverse real-world audio datasets

---

# 👨‍💻 Author

### Jashwanth Kumar G

Artificial Intelligence & Machine Learning Engineering Student

📧 [gjashwanthkumar711@gmail.com](mailto:gjashwanthkumar711@gmail.com)

🔗 **GitHub**

https://github.com/Jashwanth0533R

🔗 **LinkedIn**

https://www.linkedin.com/in/jashwanth-kumar-g-431477383/

---

# 👥 Team

**Team Name:** Storm Developers

**Project:** VoiceShield AI

**Problem Statement:** SIH 2026 – AI-Powered Real-Time Detection and Prevention of Voice Cloning Impersonation Attacks

---

# ⭐ Support

If you find VoiceShield AI useful, consider giving the repository a ⭐ on GitHub.

Contributions, suggestions, and feedback are welcome.

---

# 📜 License

Developed for academic, research, and educational purposes.

© 2026 Jashwanth Kumar G
