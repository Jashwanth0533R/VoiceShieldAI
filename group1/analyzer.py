from pathlib import Path

from inference.unified_analyzer import analyze_audio


def analyze_voice(audio_path):
    """
    Group 2 integration adapter.

    Converts the unified Group 1 + Member 2 result
    into the contract expected by Group 2.
    """

    result = analyze_audio(Path(audio_path))

    synthetic_probability = float(
        result["member1_ml"]["synthetic_probability"]
    )

    return {
        "classification": (
            "synthetic"
            if result["member1_ml"]["label"].lower() == "synthetic"
            else "genuine"
        ),
        "ai_probability": synthetic_probability,
        "human_probability": 1.0 - synthetic_probability,
        "dsp_summary": result["dsp_summary"],
        "pause_summary": result["pause_summary"],
        "member2_dsp": {
            **result["member2_dsp"],
            "feature_vector_53": result["member2_dsp"]["feature_vector_53"],
        },
    }
