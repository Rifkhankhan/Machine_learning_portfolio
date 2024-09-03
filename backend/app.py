# TODO: UPDATE THIS FILE FOR DEPLOYMENT
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

app = Flask(__name__)

# In production, you don't typically need CORS if frontend and backend are served from the same domain.
# Comment out or remove CORS if it's not needed.
# from flask_cors import CORS
# CORS(app)

# Configure the database. Ensure you have a production-ready database if not using SQLite.
# app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///friends.db')
# app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///friends.db" 
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Define the paths for your frontend static files.
frontend_folder = os.path.join(os.getcwd(), "..", "frontend")
dist_folder = os.path.join(frontend_folder, "dist")

# Server static files from the "dist" folder under the "frontend" directory
@app.route("/",defaults={"filename":""})
@app.route("/<path:filename>")
def index(filename):
  if not filename:
    filename = "index.html"
  return send_from_directory(dist_folder,filename)


# Import API routes
import routes

# Create database tables if they don't exist yet.
with app.app_context():
    db.create_all()

# Only run the app if this file is executed directly.
if __name__ == "__main__":
    app.run(debug=False)  # Disable debug mode in production