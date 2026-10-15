ALLOWED_AUDIO_EXTENSIONS = {
    ".wav",
    ".mp3",
    ".m4a",
    ".flac",
    ".ogg"
}


def validate_analysis_request(request):

    # ---------------------------
    # Audio validation
    # ---------------------------

    if "audio" not in request.files:

        return "Audio file is required"

    audio = request.files["audio"]

    if audio.filename == "":

        return "Audio filename is missing"

    filename = audio.filename.lower()

    if "." not in filename:

        return "Audio file must have an extension"

    extension = "." + filename.rsplit(".", 1)[1]

    if extension not in ALLOWED_AUDIO_EXTENSIONS:

        return (
            "Unsupported audio format. "
            "Use WAV, MP3, M4A, FLAC or OGG."
        )

    # ---------------------------
    # Transaction amount
    # ---------------------------

    amount = request.form.get(
        "transaction_amount"
    )

    if amount:

        try:

            amount = float(amount)

        except ValueError:

            return (
                "transaction_amount must be numeric"
            )

        if amount < 0:

            return (
                "transaction_amount cannot be negative"
            )

    # ---------------------------
    # Urgency
    # ---------------------------

    urgency = request.form.get(
        "urgency"
    )

    if urgency:

        allowed_urgency = {
            "low",
            "medium",
            "high",
            "critical"
        }

        if urgency.lower() not in allowed_urgency:

            return (
                "Invalid urgency. "
                "Use low, medium, high or critical."
            )

    return None