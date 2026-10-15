import numpy as np
import librosa

from audio.preprocessing import preprocess_audio

def get_feature_names():
    """
    Return the names of all extracted features
    in exactly the same order as the feature vector.
    """

    feature_names = []

    # MFCC
    for i in range(1, 14):
        feature_names.append(f"mfcc_{i}_mean")

    for i in range(1, 14):
        feature_names.append(f"mfcc_{i}_std")

    # RMS
    feature_names.append("rms_mean")
    feature_names.append("rms_std")

    # ZCR
    feature_names.append("zcr_mean")
    feature_names.append("zcr_std")

    # Spectral centroid
    feature_names.append("spectral_centroid_mean")
    feature_names.append("spectral_centroid_std")

    # Spectral bandwidth
    feature_names.append("spectral_bandwidth_mean")
    feature_names.append("spectral_bandwidth_std")

    # Spectral rolloff
    feature_names.append("spectral_rolloff_mean")
    feature_names.append("spectral_rolloff_std")

    # Spectral contrast
    for i in range(1, 8):
        feature_names.append(f"spectral_contrast_{i}_mean")

    for i in range(1, 8):
        feature_names.append(f"spectral_contrast_{i}_std")

    # Prosody
    feature_names.append("pitch_mean")
    feature_names.append("pitch_std")
    feature_names.append("voiced_ratio")

    return feature_names

def extract_acoustic_features(audio_path):
    """
    Extract acoustic, spectral, and prosodic features.

    Returns:
        numpy array containing fixed-length features.
    """

    waveform, sr = preprocess_audio(audio_path)

    # ==================================================
    # ACOUSTIC FEATURES
    # ==================================================

    # MFCC
    mfcc = librosa.feature.mfcc(
        y=waveform,
        sr=sr,
        n_mfcc=13
    )

    # RMS Energy
    rms = librosa.feature.rms(
        y=waveform
    )

    # Zero Crossing Rate
    zcr = librosa.feature.zero_crossing_rate(
        waveform
    )

    # ==================================================
    # SPECTRAL FEATURES
    # ==================================================

    spectral_centroid = librosa.feature.spectral_centroid(
        y=waveform,
        sr=sr
    )

    spectral_bandwidth = librosa.feature.spectral_bandwidth(
        y=waveform,
        sr=sr
    )

    spectral_rolloff = librosa.feature.spectral_rolloff(
        y=waveform,
        sr=sr
    )

    spectral_contrast = librosa.feature.spectral_contrast(
        y=waveform,
        sr=sr
    )

    # ==================================================
    # PROSODIC FEATURES
    # ==================================================

    # Fundamental frequency / Pitch
    f0, voiced_flag, voiced_prob = librosa.pyin(
        waveform,
        fmin=librosa.note_to_hz("C2"),
        fmax=librosa.note_to_hz("C7"),
        sr=sr
    )

    # Keep only valid voiced pitch values
    valid_f0 = f0[~np.isnan(f0)]

    # Handle audio with no detectable pitch
    if len(valid_f0) > 0:
        pitch_mean = np.mean(valid_f0)
        pitch_std = np.std(valid_f0)
    else:
        pitch_mean = 0.0
        pitch_std = 0.0

    # Percentage of frames classified as voiced
    voiced_ratio = np.mean(voiced_flag)

    # ==================================================
    # CREATE FIXED-LENGTH FEATURE VECTOR
    # ==================================================

    feature_vector = []

    # -----------------------------
    # MFCC
    # -----------------------------
    feature_vector.extend(np.mean(mfcc, axis=1))
    feature_vector.extend(np.std(mfcc, axis=1))

    # -----------------------------
    # RMS
    # -----------------------------
    feature_vector.append(np.mean(rms))
    feature_vector.append(np.std(rms))

    # -----------------------------
    # ZCR
    # -----------------------------
    feature_vector.append(np.mean(zcr))
    feature_vector.append(np.std(zcr))

    # -----------------------------
    # Spectral Centroid
    # -----------------------------
    feature_vector.append(np.mean(spectral_centroid))
    feature_vector.append(np.std(spectral_centroid))

    # -----------------------------
    # Spectral Bandwidth
    # -----------------------------
    feature_vector.append(np.mean(spectral_bandwidth))
    feature_vector.append(np.std(spectral_bandwidth))

    # -----------------------------
    # Spectral Rolloff
    # -----------------------------
    feature_vector.append(np.mean(spectral_rolloff))
    feature_vector.append(np.std(spectral_rolloff))

    # -----------------------------
    # Spectral Contrast
    # -----------------------------
    feature_vector.extend(np.mean(spectral_contrast, axis=1))
    feature_vector.extend(np.std(spectral_contrast, axis=1))

    # ==================================================
    # PROSODY
    # ==================================================

    # Pitch mean
    feature_vector.append(pitch_mean)

    # Pitch variation
    feature_vector.append(pitch_std)

    # Voiced frame ratio
    feature_vector.append(voiced_ratio)

    return np.array(feature_vector, dtype=np.float32)


if __name__ == "__main__":

    sample = r".\dataset\LA\ASVspoof2019_LA_train\flac\LA_T_1138215.flac"

    features = extract_acoustic_features(sample)
    feature_names = get_feature_names()

    print("=" * 50)
    print("FEATURE EXTRACTION + FEATURE NAMES")
    print("=" * 50)

    print("Feature vector shape :", features.shape)
    print("Number of features   :", len(features))
    print("Number of names      :", len(feature_names))

    print("\nFeature mapping:")

    for name, value in zip(feature_names, features):
        print(f"{name:30s} : {value:.6f}")