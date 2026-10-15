from flask import jsonify


def error_response(
    message,
    status_code
):

    return jsonify({
        "error": {
            "message": message,
            "status": status_code
        }
    }), status_code