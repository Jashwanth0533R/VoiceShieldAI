from pathlib import Path

import librosa
import numpy as np


TARGET_SAMPLE_RATE = 16_000


def load_audio(
    file_path: str | Path,
    target_sample_rate: int = TARGET_SAMPLE_RATE,
) -> tuple[np.ndarray, int]:
    """
    Load an audio file and prepare it for the ML pipeline.

    Steps:
    1. Load audio as mono.
    2. Resample to the target sample rate.
    3. Normalize the waveform.

    Returns:
        waveform: NumPy array containing the audio samples.
        sample_rate: Sample rate of the returned waveform.
    """

    file_path = Path(file_path)

    if not file_path.exists():
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    # Load audio as mono.
    waveform, sample_rate = librosa.load(
        str(file_path),
        sr=None,
        mono=True,
    )

    # Convert sample rate if necessary.
    if sample_rate != target_sample_rate:
        waveform = librosa.resample(
            waveform,
            orig_sr=sample_rate,
            target_sr=target_sample_rate,
        )
        sample_rate = target_sample_rate

    # Normalize amplitude.
    max_amplitude = np.max(np.abs(waveform))

    if max_amplitude > 0:
        waveform = waveform / max_amplitude

    return waveform.astype(np.float32), sample_rate