from flask import Flask, send_from_directory, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

app = Flask(__name__)

# Configure CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configure the database (update URI for production as needed)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///models.db')
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['MODEL_FILES'] = 'modelFiles'
app.config['SCALER_FILES'] = 'scalerFiles'
app.config['ENCODING_FILES'] = 'encodingFiles'
app.config['HEATMAP_FILES'] = 'heatmaps'

db = SQLAlchemy(app)

# Define the paths for your frontend static files
frontend_folder = os.path.join(os.getcwd(), "..", "frontend")
dist_folder = os.path.join(frontend_folder, "dist")

# Serve heatmap images
@app.route('/api/heatmaps/<filename>')
def get_heatmap_image(filename):
    return send_from_directory(app.config['HEATMAP_FILES'], filename)

# Serve static files
# Serve static files
@app.route("/", defaults={"filename": ""})
@app.route("/<path:filename>")
def index(filename):
    # Print request to see what is being handled
    print(f"Serving static file: {filename}")
    if filename in ["", "index.html"]:
        # Directly serve index.html for root and empty filename
        filename = "index.html"
    elif os.path.exists(os.path.join(dist_folder, filename)):
        # Check if the file exists before serving
        return send_from_directory(dist_folder, filename)
    else:
        # Serve index.html for other routes
        filename = "index.html"
    return send_from_directory(dist_folder, filename)

# Fallback route to handle client-side routing (should be last)
@app.route("/<path:path>")
def catch_all(path):
    print(f"Fallback route hit: {path}")
    return send_from_directory(dist_folder, "index.html")


# Import API routes
import routes

# Initialize database migrations
from flask_migrate import Migrate
migrate = Migrate(app, db)

# Error handling
@app.errorhandler(404)
def page_not_found(error):
    return jsonify({"error": "Page not found"}), 404

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({"error": "Internal server error"}), 500

# Only run the app if this file is executed directly
if __name__ == "__main__":
    app.run(debug=False)
    
    
