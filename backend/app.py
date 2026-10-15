from flask import Flask
from flask_cors import CORS

from backend.routes.health import health_bp
from backend.routes.analyze import analyze_bp
from backend.routes.risk import risk_bp


def create_app():
    app = Flask(__name__)

    # Allow frontend to communicate with backend
    CORS(app)

    # Maximum uploaded audio size: 20 MB
    app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024

    # Register routes
    app.register_blueprint(health_bp)
    app.register_blueprint(analyze_bp)
    app.register_blueprint(risk_bp)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )