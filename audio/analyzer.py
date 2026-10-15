from pathlib import Path
import joblib
import numpy as np

from audio.preprocessing import preprocess_audio
from audio.features import extract_acoustic_features


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "logistic_regression_detector.pkl")
SCALER_PATH = Path(r".\models\logistic_regression_scaler.pkl")


# --------------------------------------------------
# Load model and scaler
# --------------------------------------------------

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)


# --------------------------------------------------
# Analyze a single audio file
# --------------------------------------------------

def analyze_voice(audio_path):

    audio_path = Path(audio_path)

    if not audio_path.exists():
        raise FileNotFoundError(
            f"Audio not found: {audio_path}"
        )

    # Step 1 + 2: Preprocess audio and extract 53 features
    features = extract_acoustic_features(audio_path)

    # Preprocess separately only for duration/sample rate
    waveform, sample_rate = preprocess_audio(audio_path)

    # Convert to 2D array
    features = np.asarray(features).reshape(1, -1)

    # Step 3: Scale features
    features_scaled = scaler.transform(features)

    # Step 4: Predict
    prediction = model.predict(features_scaled)[0]

    probabilities = model.predict_proba(
        features_scaled
    )[0]

    bonafide_probability = probabilities[0]
    spoof_probability = probabilities[1]

    # Step 5: Classification
    if prediction == 1:
        classification = "spoof"
    else:
        classification = "bonafide"

    return {
        "classification": classification,
        "spoof_probability": float(spoof_probability),
        "bonafide_probability": float(bonafide_probability),
        "sample_rate": int(sample_rate),
        "duration_seconds": float(
            len(waveform) / sample_rate
        ),
        "feature_vector_53": [float(x) for x in features.flatten()],
    }


# --------------------------------------------------
# Test analyzer
# --------------------------------------------------

if __name__ == "__main__":

    sample_audio = r"D:\SIH\Member 2\dataset\LA\ASVspoof2019_LA_train\flac\LA_T_1138215.flac"

    result = analyze_voice(sample_audio)

    print("=" * 60)
    print("VOICE ANALYSIS RESULT")
    print("=" * 60)

    print(f"Classification       : {result['classification']}")
    print(
        f"Spoof Probability    : "
        f"{result['spoof_probability'] * 100:.2f}%"
    )
    print(
        f"Bonafide Probability : "
        f"{result['bonafide_probability'] * 100:.2f}%"
    )
    print(
        f"Sample Rate          : "
        f"{result['sample_rate']} Hz"
    )
    print(
        f"Duration             : "
        f"{result['duration_seconds']:.2f} sec"
    )

    print("=" * 60)
    print("VOICE ANALYZER TEST SUCCESSFUL")
    print("=" * 60)
