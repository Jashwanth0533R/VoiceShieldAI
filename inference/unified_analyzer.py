from pathlib import Path
import sys

import librosa
import numpy as np

# Project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Member 1 ML pipeline
from member1_preprocessing.feature_extraction import (
    AudioFeatureExtractor,
    create_fixed_length_features,
)
from inference.svm_detector import VoiceCloningPredictor

# Member 2 DSP pipeline
from audio.analyzer import analyze_voice
from audio.preprocessing import preprocess_audio


# ---------------------------------------------------------
# Initialize Member 1 predictor once
# ---------------------------------------------------------

member1_predictor = VoiceCloningPredictor(
    model_path=PROJECT_ROOT / "models" / "svm_voice_detector.pkl",
    scaler_path=PROJECT_ROOT / "models" / "svm_scaler.pkl",
)


def extract_dsp_summary(audio_path: str | Path) -> dict:
    """
    Extract interpretable acoustic, spectral and prosodic
    measurements from the audio.
    """

    waveform, sample_rate = preprocess_audio(audio_path)

    # Frame-level features
    rms = librosa.feature.rms(y=waveform)
    zcr = librosa.feature.zero_crossing_rate(waveform)

    spectral_centroid = librosa.feature.spectral_centroid(
        y=waveform,
        sr=sample_rate,
    )

    spectral_bandwidth = librosa.feature.spectral_bandwidth(
        y=waveform,
        sr=sample_rate,
    )

    spectral_rolloff = librosa.feature.spectral_rolloff(
        y=waveform,
        sr=sample_rate,
    )

    # Pitch estimation
    try:
        f0, voiced_flag, voiced_prob = librosa.pyin(
            waveform,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
            sr=sample_rate,
        )

        voiced_f0 = f0[~np.isnan(f0)]

        if len(voiced_f0) > 0:
            pitch_mean = float(np.mean(voiced_f0))
            pitch_std = float(np.std(voiced_f0))
        else:
            pitch_mean = 0.0
            pitch_std = 0.0

        voiced_ratio = float(np.mean(~np.isnan(f0)))

    except Exception:
        pitch_mean = 0.0
        pitch_std = 0.0
        voiced_ratio = 0.0

    return {
        "energy": {
            "rms_mean": float(np.mean(rms)),
            "rms_std": float(np.std(rms)),
        },

        "zero_crossing_rate": {
            "mean": float(np.mean(zcr)),
            "std": float(np.std(zcr)),
        },

        "spectral": {
            "centroid_mean_hz": float(np.mean(spectral_centroid)),
            "centroid_std_hz": float(np.std(spectral_centroid)),
            "bandwidth_mean_hz": float(np.mean(spectral_bandwidth)),
            "bandwidth_std_hz": float(np.std(spectral_bandwidth)),
            "rolloff_mean_hz": float(np.mean(spectral_rolloff)),
            "rolloff_std_hz": float(np.std(spectral_rolloff)),
        },

        "prosody": {
            "pitch_mean_hz": pitch_mean,
            "pitch_std_hz": pitch_std,
            "voiced_ratio": voiced_ratio,
        },
    }

def analyze_pauses(
    audio_path: str | Path,
    top_db: int = 30,
) -> dict:
    """
    Analyze speech and silence/pause patterns.

    Returns measurable pause statistics.
    No AI/risk decision is made here.
    """

    waveform, sample_rate = preprocess_audio(audio_path)

    # Detect intervals containing non-silent audio.
    intervals = librosa.effects.split(
        waveform,
        top_db=top_db,
    )

    total_duration = len(waveform) / sample_rate

    if len(intervals) == 0:
        return {
            "speech_ratio": 0.0,
            "silence_ratio": 1.0,
            "pause_count": 0,
            "average_pause_duration_seconds": 0.0,
            "maximum_pause_duration_seconds": 0.0,
        }

    speech_duration = sum(
        (end - start) / sample_rate
        for start, end in intervals
    )

    pauses = []

    for i in range(len(intervals) - 1):
        pause_samples = intervals[i + 1][0] - intervals[i][1]

        if pause_samples > 0:
            pauses.append(pause_samples / sample_rate)

    silence_duration = max(
        total_duration - speech_duration,
        0.0,
    )

    speech_ratio = speech_duration / total_duration
    silence_ratio = silence_duration / total_duration

    return {
        "speech_ratio": float(speech_ratio),
        "silence_ratio": float(silence_ratio),
        "pause_count": len(pauses),
        "average_pause_duration_seconds": (
            float(np.mean(pauses)) if pauses else 0.0
        ),
        "maximum_pause_duration_seconds": (
            float(np.max(pauses)) if pauses else 0.0
        ),
    }
    
def analyze_audio(audio_path: str | Path) -> dict:
    """
    Run Member 1 ML, Member 2 DSP classifier and
    interpretable DSP measurements on the same audio.
    """

    audio_path = Path(audio_path)

    if not audio_path.exists():
        raise FileNotFoundError(
            f"Audio file not found: {audio_path}"
        )

    # -----------------------------------------------------
    # Member 1: ML voice cloning detector
    # -----------------------------------------------------

    member1_result = member1_predictor.predict_audio(audio_path)

    # -----------------------------------------------------
    # Member 2: DSP classifier
    # -----------------------------------------------------

    member2_result = analyze_voice(audio_path)

    # -----------------------------------------------------
    # Interpretable DSP measurements
    # -----------------------------------------------------

    dsp_summary = extract_dsp_summary(audio_path)

    # -----------------------------------------------------
    # Unified result
    # -----------------------------------------------------
    pause_summary = analyze_pauses(audio_path)
    
    return {
        "audio_file": str(audio_path),

        "member1_ml": {
            "label": member1_result["label"],
            "synthetic_probability": member1_result[
                "synthetic_probability"
            ],
        },

        "member2_dsp": {
            "classification": member2_result["classification"],
            "spoof_probability": member2_result["spoof_probability"],
            "bonafide_probability": member2_result["bonafide_probability"],
            "sample_rate": member2_result["sample_rate"],
            "duration_seconds": member2_result["duration_seconds"],
            "feature_vector_53": member2_result["feature_vector_53"],
        },

        "dsp_summary": dsp_summary,
        "pause_summary": pause_summary,
    }


# ---------------------------------------------------------
# Test
# ---------------------------------------------------------

if __name__ == "__main__":

    sample_audio = (
        r"D:\SIH\Member 2\dataset\LA"
        r"\ASVspoof2019_LA_train\flac"
        r"\LA_T_1138215.flac"
    )

    result = analyze_audio(sample_audio)

    print("=" * 60)
    print("UNIFIED VOICE ANALYSIS")
    print("=" * 60)

    print("\n[Member 1 - ML]")
    print("Label                :", result["member1_ml"]["label"])
    print(
        "Synthetic Probability:",
        f'{result["member1_ml"]["synthetic_probability"] * 100:.2f}%'
    )

    print("\n[Member 2 - DSP]")
    print(
        "Classification       :",
        result["member2_dsp"]["classification"],
    )
    print(
        "Spoof Probability    :",
        f'{result["member2_dsp"]["spoof_probability"] * 100:.2f}%'
    )
    print(
        "Bonafide Probability :",
        f'{result["member2_dsp"]["bonafide_probability"] * 100:.2f}%'
    )

    print("\n[DSP Measurements]")

    print(
        "RMS Mean             :",
        f'{result["dsp_summary"]["energy"]["rms_mean"]:.6f}',
    )

    print(
        "RMS Std              :",
        f'{result["dsp_summary"]["energy"]["rms_std"]:.6f}',
    )

    print(
        "ZCR Mean             :",
        f'{result["dsp_summary"]["zero_crossing_rate"]["mean"]:.6f}',
    )

    print(
        "Spectral Centroid    :",
        f'{result["dsp_summary"]["spectral"]["centroid_mean_hz"]:.2f}',
        "Hz",
    )

    print(
        "Spectral Bandwidth   :",
        f'{result["dsp_summary"]["spectral"]["bandwidth_mean_hz"]:.2f}',
        "Hz",
    )

    print(
        "Spectral Rolloff     :",
        f'{result["dsp_summary"]["spectral"]["rolloff_mean_hz"]:.2f}',
        "Hz",
    )

    print(
        "Pitch Mean           :",
        f'{result["dsp_summary"]["prosody"]["pitch_mean_hz"]:.2f}',
        "Hz",
    )

    print(
        "Pitch Std            :",
        f'{result["dsp_summary"]["prosody"]["pitch_std_hz"]:.2f}',
        "Hz",
    )

    print(
        "Voiced Ratio         :",
        f'{result["dsp_summary"]["prosody"]["voiced_ratio"] * 100:.2f}%'
    )

    print("\n[Pause / Silence Analysis]")

    print(
        "Speech Ratio         :",
        f'{result["pause_summary"]["speech_ratio"] * 100:.2f}%'
    )

    print(
        "Silence Ratio        :",
        f'{result["pause_summary"]["silence_ratio"] * 100:.2f}%'
    )

    print(
        "Pause Count          :",
        result["pause_summary"]["pause_count"]
    )

    print(
        "Average Pause        :",
        f'{result["pause_summary"]["average_pause_duration_seconds"]:.3f}',
        "sec",
    )

    print(
        "Maximum Pause        :",
        f'{result["pause_summary"]["maximum_pause_duration_seconds"]:.3f}',
        "sec",
    )
    print("=" * 60)
    print("UNIFIED ANALYZER TEST SUCCESSFUL")
    print("=" * 60)