import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

# Add project root to Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from member1_preprocessing.audio_loader import load_audio
from member1_preprocessing.feature_extraction import (
    AudioFeatureExtractor,
    create_fixed_length_features,
)


# ============================================================
# MODEL PATHS
# ============================================================

MODEL_PATH = PROJECT_ROOT / "models" / "svm_voice_detector.pkl"
SCALER_PATH = PROJECT_ROOT / "models" / "svm_scaler.pkl"


# ============================================================
# VOICE CLONING PREDICTOR
# ============================================================

class VoiceCloningPredictor:
    """
    Prediction interface for genuine vs synthetic speech.

    Classes:
        0 = Genuine
        1 = Synthetic
    """

    def __init__(
        self,
        model_path=MODEL_PATH,
        scaler_path=SCALER_PATH,
        synthetic_threshold=0.5,
    ):
        self.synthetic_threshold = synthetic_threshold

        # Check model files
        if not Path(model_path).exists():
            raise FileNotFoundError(
                f"Model not found: {model_path}"
            )

        if not Path(scaler_path).exists():
            raise FileNotFoundError(
                f"Scaler not found: {scaler_path}"
            )

        # Load trained SVM
        self.model = joblib.load(model_path)

        # Load matching StandardScaler
        self.scaler = joblib.load(scaler_path)

        # Feature extractor
        self.extractor = AudioFeatureExtractor()

    # ========================================================
    # PREDICT FROM FEATURES
    # ========================================================

    def predict(self, features):
        """
        Predict whether a feature vector represents
        genuine or synthetic speech.

        Args:
            features:
                194-dimensional feature vector.

        Returns:
            List containing prediction dictionaries.
        """

        features = np.asarray(
            features,
            dtype=np.float32,
        )

        # Convert single vector to batch
        if features.ndim == 1:
            features = features.reshape(1, -1)

        # Validate feature count
        if features.shape[1] != 194:
            raise ValueError(
                f"Expected 194 features, "
                f"but received {features.shape[1]}."
            )

        # Recreate the same feature names used during training
        feature_names = [
            f"feature_{i}"
            for i in range(194)
        ]

        # Convert to DataFrame so the scaler receives
        # the same feature names used during training
        features_df = pd.DataFrame(
            features,
            columns=feature_names,
        )

        # Apply trained scaler
        features_scaled = self.scaler.transform(
            features_df
        )

        # Get probabilities
        probabilities = self.model.predict_proba(
            features_scaled
        )

        # Class 1 = Synthetic
        synthetic_probability = probabilities[:, 1]

        # Apply threshold
        predictions = (
            synthetic_probability
            >= self.synthetic_threshold
        )

        results = []

        for probability, prediction in zip(
            synthetic_probability,
            predictions,
        ):
            probability = float(probability)

            if prediction:
                label = "Synthetic"
            else:
                label = "Genuine"

            risk_score = probability * 100

            results.append(
                {
                    "label": label,
                    "synthetic_probability": probability,
                    "risk_score": risk_score,
                }
            )

        return results

    # ========================================================
    # PREDICT FROM AUDIO
    # ========================================================

    def predict_audio(self, audio_path):
        """
        Predict whether an audio file is genuine
        or synthetic.

        Args:
            audio_path:
                Path to WAV, FLAC, or MP3 audio.

        Returns:
            Prediction dictionary.
        """

        audio_path = Path(audio_path)

        if not audio_path.exists():
            raise FileNotFoundError(
                f"Audio file not found: {audio_path}"
            )

        # --------------------------------------------
        # 1. Load and preprocess audio
        # --------------------------------------------

        waveform, sample_rate = load_audio(
            audio_path
        )

        # --------------------------------------------
        # 2. Extract features
        # --------------------------------------------

        features = self.extractor.extract_all(
            waveform
        )

        # --------------------------------------------
        # 3. Convert to fixed 194-dimensional vector
        # --------------------------------------------

        feature_vector = create_fixed_length_features(
            features
        )

        # --------------------------------------------
        # 4. Predict
        # --------------------------------------------

        result = self.predict(
            feature_vector
        )

        return result[0]


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print("\n===== Final SVM Prediction Test =====")

    try:

        # Create predictor
        predictor = VoiceCloningPredictor()

        print(
            "Final SVM model loaded successfully!"
        )

        print(
            "Scaler loaded successfully!"
        )

        # Display model configuration
        print("\nModel configuration:")
        print(
            "Kernel :",
            predictor.model.kernel,
        )

        print(
            "C      :",
            predictor.model.C,
        )

        print(
            "Gamma  :",
            predictor.model.gamma,
        )

        print(
            "Features:",
            194,
        )

        print(
            "Threshold:",
            predictor.synthetic_threshold,
        )

        print(
            "\nPrediction interface test passed!"
        )

    except Exception as e:

        print(
            "\nPrediction interface test FAILED!"
        )

        print(
            "Error:",
            e,
        )