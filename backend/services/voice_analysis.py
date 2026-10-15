import json
import os


MOCK_RESULT_PATH = os.path.join(
    "mock",
    "mock_voice_result.json"
)


USE_MOCK = False


def analyze_audio(audio_path):
    """
    Sends audio to Group 1.

    During development:
        returns mock Group 1 result.

    During integration:
        calls Group 1 analyze_voice(audio_path).
    """

    if not os.path.exists(audio_path):
        raise FileNotFoundError(
            "Audio file does not exist"
        )

    if USE_MOCK:
        return get_mock_voice_result()

    return call_group1(audio_path)


def get_mock_voice_result():

    with open(
        MOCK_RESULT_PATH,
        "r"
    ) as file:

        result = json.load(file)

    validate_voice_result(result)

    return result


def call_group1(audio_path):
    """
    Group 1 integration point.

    Group 1 must expose:

        analyze_voice(audio_path)

    Do not modify Group 1's internal ML implementation.
    """

    try:

        from group1.analyzer import analyze_voice

    except ImportError:

        raise RuntimeError(
            "Group 1 analyzer could not be imported"
        )

    result = analyze_voice(audio_path)

    validate_voice_result(result)

    return result


def validate_voice_result(result):

    required_fields = [
        "classification",
        "ai_probability",
        "human_probability"
    ]

    for field in required_fields:

        if field not in result:

            raise ValueError(
                f"Group 1 result missing field: {field}"
            )

    ai_probability = result["ai_probability"]
    human_probability = result["human_probability"]

    if not isinstance(
        ai_probability,
        (int, float)
    ):
        raise ValueError(
            "ai_probability must be numeric"
        )

    if not isinstance(
        human_probability,
        (int, float)
    ):
        raise ValueError(
            "human_probability must be numeric"
        )

    if not 0 <= ai_probability <= 1:
        raise ValueError(
            "ai_probability must be between 0 and 1"
        )

    if not 0 <= human_probability <= 1:
        raise ValueError(
            "human_probability must be between 0 and 1"
        )

    return True