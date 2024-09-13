from flask import Flask, send_from_directory, jsonify,request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import json
import pandas as pd
import numpy as np

import csv
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
app.config['MATRICES_FILES'] = 'matricesFiles'
app.config['DATASET_FILES'] = 'datasetFiles'
app.config['FINAL_MATRICES_FILES'] = 'finalMatricesFiles'
app.config['CONFUSION_MATRICES_FILES'] = 'confusionMatricesFiles'
app.config['FINAL_CONFUSION_MATRICES_FILES'] = 'finalConfusionMatricesFiles'



db = SQLAlchemy(app)

# Define the paths for your frontend static files
frontend_folder = os.path.join(os.getcwd(), "..", "frontend")
dist_folder = os.path.join(frontend_folder, "dist")


# # New route to get CSV headers from a stored CSV file
@app.route('/api/dataset/<filename>', methods=['GET'])
def get_dataset(filename):
    try:
        file_path = os.path.join(app.config['DATASET_FILES'], filename)
        if not os.path.isfile(file_path):
            return jsonify({"error": "File not found"}), 404

        # Read the CSV file using pandas
        df = pd.read_csv(file_path)
        
        # Replace NaN values with None (which converts to null in JSON)
        df = df.replace({np.nan: None})
        
        # Limit to the first 10 rows
        limited_df = df.head(10)

        # Convert DataFrame to JSON
        data = limited_df.to_dict(orient='records')
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
    
# Serve heatmap images
@app.route('/api/<file_type>/<filename>')
def get_heatmap_image(file_type,filename):
    
      # Define a mapping of file types to their respective directories
    file_directories = {
        "heatmaps": app.config['HEATMAP_FILES'],
        "matricesFiles": app.config['MATRICES_FILES'],
        "confusionMatricesFiles": app.config['CONFUSION_MATRICES_FILES'],
        "finalConfusionMatricesFiles": app.config['FINAL_CONFUSION_MATRICES_FILES'],
        "datasetFiles": app.config['DATASET_FILES'],
        "finalMatricesFiles": app.config['FINAL_MATRICES_FILES'],
    }
    
     # Get the directory for the given file type, or return 404 if not found
    directory = file_directories.get(file_type)
    if directory:
        return send_from_directory(directory, filename)
    else:
        return jsonify({"error": "Invalid file type"}), 404
    
   

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
    
    
