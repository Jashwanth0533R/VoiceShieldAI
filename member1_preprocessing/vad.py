import torch
import torchaudio


class SileroVAD:
    """
    Voice Activity Detection using the Silero VAD model.
    """

    def __init__(self):
        self.model, self.utils = torch.hub.load(
            repo_or_dir="snakers4/silero-vad",
            model="silero_vad",
            force_reload=False,
        )

        (
            self.get_speech_timestamps,
            self.save_audio,
            self.read_audio,
            self.VADIterator,
            self.collect_chunks,
        ) = self.utils

    def get_speech_segments(
        self,
        audio: torch.Tensor,
        sample_rate: int = 16000,
    ):
        """
        Detect speech regions in an audio waveform.

        Args:
            audio: Audio waveform as a torch Tensor.
            sample_rate: Audio sample rate.

        Returns:
            List of speech timestamps.
        """

        if audio.ndim == 2:
            audio = audio.squeeze(0)

        audio = audio.float()

        speech_timestamps = self.get_speech_timestamps(
            audio,
            self.model,
            sampling_rate=sample_rate,
        )

        return speech_timestamps