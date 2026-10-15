import os
import uuid

from flask import Blueprint, request, jsonify

from backend.services.voice_analysis import analyze_audio
from backend.services.context_analysis import get_context
from backend.services.risk_analysis import analyze_risk
from backend.utils.validation import validate_analysis_request
from backend.utils.errors import error_response


analyze_bp = Blueprint("analyze", __name__)

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@analyze_bp.route("/analyze", methods=["POST"])
def analyze():

    try:
        # ---------------------------------
        # 1. Validate request
        # ---------------------------------
        validation_error = validate_analysis_request(request)

        if validation_error:
            return error_response(
                validation_error,
                400
            )

        # ---------------------------------
        # 2. Get uploaded audio
        # ---------------------------------
        audio = request.files["audio"]

        # Generate unique filename
        extension = os.path.splitext(audio.filename)[1]

        filename = f"{uuid.uuid4()}{extension}"

        audio_path = os.path.join(
            UPLOAD_FOLDER,
            filename
        )

        audio.save(audio_path)

        # ---------------------------------
        # 3. Extract context
        # ---------------------------------
        context = get_context(request)

        # ---------------------------------
        # 4. Send audio to Group 1
        # ---------------------------------
        voice_result = analyze_audio(audio_path)

        # ---------------------------------
        # 5. Send Group 1 result + context
        #    to risk-engine interface
        # ---------------------------------
        risk_result = analyze_risk(
            voice_result,
            context
        )

        # ---------------------------------
        # 6. Create final API response
        # ---------------------------------
        response = {
            "voice_analysis": voice_result,
            "risk_analysis": {
                "risk_score": risk_result.get("risk_score"),
                "risk_level": risk_result.get("risk_level"),
            },
            "risk_factors": risk_result.get(
                "risk_factors",
                {}
            ),
            "explanation": risk_result.get(
                "explanation",
                []
            ),
            "recommendation": risk_result.get(
                "recommendation",
                {}
            )
        }

        return jsonify(response), 200

    except FileNotFoundError:
        return error_response(
            "Audio file could not be processed",
            400
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_response(
            "Internal analysis error",
            500
        )

    finally:

        # Delete temporary uploaded file
        try:
            if "audio_path" in locals() and os.path.exists(audio_path):
                os.remove(audio_path)
        except Exception:
            pass