
from pathlib import Path
import librosa
import numpy as np

TARGET_SR = 16000


def preprocess_audio(audio_path):
    """
    Load and preprocess an audio file.

    Returns:
        waveform (numpy array)
        sample_rate (int)
    """

    audio_path = Path(audio_path)

    if not audio_path.exists():
        raise FileNotFoundError(f"Audio not found: {audio_path}")

    # Load audio as mono and resample to 16 kHz
    waveform, sr = librosa.load(
        audio_path,
        sr=TARGET_SR,
        mono=True
    )

    # Normalize amplitude
    max_amp = np.max(np.abs(waveform))

    if max_amp > 0:
        waveform = waveform / max_amp

    return waveform, sr


if __name__ == "__main__":

    sample = r".\dataset\LA\ASVspoof2019_LA_train\flac\LA_T_1138215.flac"

    audio, sr = preprocess_audio(sample)

    print("=" * 40)
    print("Audio preprocessing successful!")
    print("=" * 40)
    print(f"Sample Rate : {sr}")
    print(f"Samples     : {len(audio)}")
    print(f"Duration    : {len(audio)/sr:.2f} sec")
    print(f"Max Amplitude : {audio.max():.3f}")
    print(f"Min Amplitude : {audio.min():.3f}")