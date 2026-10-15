from flask import Blueprint, jsonify

risk_bp = Blueprint(
    "risk",
    __name__
)


@risk_bp.route(
    "/risk/status",
    methods=["GET"]
)
def risk_status():

    return jsonify({
        "status": "available",
        "service": "VoiceShield Risk Engine"
    }), 200