import librosa
import numpy as np


class AudioFeatureExtractor:
    """
    Extract acoustic features from an audio waveform.

    Features:
        - MFCC
        - Mel-spectrogram
        - Spectral centroid
        - Spectral bandwidth
        - Spectral rolloff
        - Zero-crossing rate
    """

    def __init__(
        self,
        sample_rate: int = 16000,
        n_fft: int = 1024,
        hop_length: int = 256,
        n_mels: int = 80,
        n_mfcc: int = 13,
    ):
        self.sample_rate = sample_rate
        self.n_fft = n_fft
        self.hop_length = hop_length
        self.n_mels = n_mels
        self.n_mfcc = n_mfcc

    def extract_mfcc(self, waveform: np.ndarray) -> np.ndarray:
        """
        Extract MFCC features.

        Returns:
            Shape: (n_mfcc, time_frames)
        """

        mfcc = librosa.feature.mfcc(
            y=waveform,
            sr=self.sample_rate,
            n_mfcc=self.n_mfcc,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
        )

        return mfcc.astype(np.float32)

    def extract_mel_spectrogram(
        self,
        waveform: np.ndarray,
    ) -> np.ndarray:
        """
        Extract log-Mel spectrogram.

        Returns:
            Shape: (n_mels, time_frames)
        """

        mel = librosa.feature.melspectrogram(
            y=waveform,
            sr=self.sample_rate,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
            n_mels=self.n_mels,
        )

        log_mel = librosa.power_to_db(
            mel,
            ref=np.max,
        )

        return log_mel.astype(np.float32)

    def extract_spectral_features(
        self,
        waveform: np.ndarray,
    ) -> dict[str, np.ndarray]:
        """
        Extract additional spectral features.
        """

        spectral_centroid = librosa.feature.spectral_centroid(
            y=waveform,
            sr=self.sample_rate,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
        )

        spectral_bandwidth = librosa.feature.spectral_bandwidth(
            y=waveform,
            sr=self.sample_rate,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
        )

        spectral_rolloff = librosa.feature.spectral_rolloff(
            y=waveform,
            sr=self.sample_rate,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
        )

        zero_crossing_rate = librosa.feature.zero_crossing_rate(
            waveform,
            hop_length=self.hop_length,
        )

        return {
            "spectral_centroid": spectral_centroid.astype(np.float32),
            "spectral_bandwidth": spectral_bandwidth.astype(np.float32),
            "spectral_rolloff": spectral_rolloff.astype(np.float32),
            "zero_crossing_rate": zero_crossing_rate.astype(np.float32),
        }

    def extract_all(
        self,
        waveform: np.ndarray,
    ) -> dict[str, np.ndarray]:
        """
        Extract all supported acoustic features.
        """

        return {
            "mfcc": self.extract_mfcc(waveform),
            "mel_spectrogram": self.extract_mel_spectrogram(waveform),
            **self.extract_spectral_features(waveform),
        }


def create_fixed_length_features(
    features: dict[str, np.ndarray],
) -> np.ndarray:
    """
    Convert variable-length frame-level features
    into a fixed-length feature vector.

    Mean and standard deviation are calculated
    across the time dimension.
    """

    feature_vector = []

    for name, values in features.items():

        values = np.asarray(values, dtype=np.float32)

        # Convert 1D features to (1, time)
        if values.ndim == 1:
            values = values.reshape(1, -1)

        # Calculate mean across time
        mean = np.mean(values, axis=1)

        # Calculate standard deviation across time
        std = np.std(values, axis=1)

        # Add both to the feature vector
        feature_vector.extend(mean)
        feature_vector.extend(std)

    return np.asarray(feature_vector, dtype=np.float32)