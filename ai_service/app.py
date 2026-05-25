from flask import Flask
from dotenv import load_dotenv
import os
import logging

logging.basicConfig(level=logging.INFO)
load_dotenv()

app = Flask(__name__)

# Import routes
from routes.forecast_routes import forecast_bp
app.register_blueprint(forecast_bp, url_prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok", "service": "hotel-ai-service", "version": "1.0.0"}

if __name__ == "__main__":
    # Khởi động auto-train scheduler 
    from scheduler import start_scheduler
    start_scheduler()

    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)  # debug=False khi dùng scheduler
