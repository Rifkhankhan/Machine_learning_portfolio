from app import app, db
from flask import request, jsonify
from models import Friend
from datetime import datetime
from models import Model
import os
import json
from models import Feature
# Get all friends
@app.route("/api/friends",methods=["GET"])
def get_friends():
  friends = Friend.query.all() 
  result = [friend.to_json() for friend in friends]
  return jsonify(result)

# Create a friend
@app.route("/api/friends",methods=["POST"])
def create_friend():
  try:
    data = request.json

    # Validations
    required_fields = ["name","role","description","gender"]
    for field in required_fields:
      if field not in data or not data.get(field):
        return jsonify({"error":f'Missing required field: {field}'}), 400

    name = data.get("name")
    role = data.get("role")
    description = data.get("description")
    gender = data.get("gender")

    # Fetch avatar image based on gender
    if gender == "male":
      img_url = f"https://avatar.iran.liara.run/public/boy?username={name}"
    elif gender == "female":
      img_url = f"https://avatar.iran.liara.run/public/girl?username={name}"
    else:
      img_url = None

    new_friend = Friend(name=name, role=role, description=description, gender= gender, img_url=img_url)

    db.session.add(new_friend) 
    db.session.commit()

    return jsonify(new_friend.to_json()), 201
    
  except Exception as e:
    db.session.rollback()
    return jsonify({"error":str(e)}), 500
  
# Delete a friend
@app.route("/api/friends/<int:id>",methods=["DELETE"])
def delete_friend(id):
  try:
    friend = Friend.query.get(id)
    if friend is None:
      return jsonify({"error":"Friend not found"}), 404
    
    db.session.delete(friend)
    db.session.commit()
    return jsonify({"msg":"Friend deleted"}), 200
  except Exception as e:
    db.session.rollback()
    return jsonify({"error":str(e)}),500
  
# Update a friend profile
@app.route("/api/friends/<int:id>",methods=["PATCH"])
def update_friend(id):
  try:
    friend = Friend.query.get(id)
    if friend is None:
      return jsonify({"error":"Friend not found"}), 404
    
    data = request.json

    friend.name = data.get("name",friend.name)
    friend.role = data.get("role",friend.role)
    friend.description = data.get("description",friend.description)
    friend.gender = data.get("gender",friend.gender)

    db.session.commit()
    return jsonify(friend.to_json()),200
  except Exception as e:
    db.session.rollback()
    return jsonify({"error":str(e)}),500

# Define function to get timestamped filename
def get_timestamped_filename(filename):
    # Extract the file extension and base name
    base_name, file_ext = os.path.splitext(filename)
    # Generate a timestamp
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    # Combine the base name with the timestamp and extension
    return f"{base_name}-{timestamp}{file_ext}"

@app.route("/api/models", methods=["POST"])
def create_model():
    try:
        # Check if files are present
        if 'filename' not in request.files or 'heatmap_image' not in request.files:
            return jsonify({"error": "Missing required file(s)"}), 400
        
        # Extract form data
        name = request.form.get("name")
        description = request.form.get("description")
        about_dataset = request.form.get("about_dataset")
        best_algorithm = request.form.get("best_algorithm")
        model_type = request.form.get("model_type")
        source_link = request.form.get("source_link", None)
        features = request.form.get("features")
        algorithm_used = request.form.get("algorithm_used")

        # Validate required form fields
        required_fields = ["name", "description", "about_dataset", "best_algorithm", "model_type", "features", "algorithm_used"]
        if not all(field in request.form and request.form.get(field) for field in required_fields):
            return jsonify({"error": "Missing required field"}), 400
        
        # Extract file data
        filename = request.files['filename']
        heatmap_image = request.files['heatmap_image']

        # Validate filenames
        if not filename.filename or not heatmap_image.filename:
            return jsonify({"error": "Invalid file(s)"}), 400

        # Save files with timestamp in the filename
        filename_path = os.path.join(app.config['MODEL_FILES'], get_timestamped_filename(filename.filename))
        heatmap_image_path = os.path.join(app.config['HEATMAP_FILES'], get_timestamped_filename(heatmap_image.filename))

        filename.save(filename_path)
        heatmap_image.save(heatmap_image_path)

        # Convert features and algorithm_used to JSON
        features_list = json.loads(features)
        algorithm_used_list = json.loads(algorithm_used)

        # Create new model instance
        new_model = Model(
            name=name,
            description=description,
            filename=get_timestamped_filename(filename.filename),
            heatmap_image=get_timestamped_filename(heatmap_image.filename),
            about_dataset=about_dataset,
            best_algorithm=best_algorithm,
            features=json.dumps(features_list),
            algorithm_used=json.dumps(algorithm_used_list),
            model_type=model_type,
            source_link=source_link
        )

        db.session.add(new_model)
        db.session.commit()

        # Create and save features in the new table
        for feature in features_list:
            new_feature = Feature(
                name=feature["name"],
                datatype=feature["datatype"],
                description=feature["desc"]
            )
            db.session.add(new_feature)
            
        db.session.commit()

        return jsonify(new_model.to_json()), 201

    except Exception as e:
        db.session.rollback()
        print("Error:", str(e))  # For debugging; remove or handle properly in production
        return jsonify({"error": str(e)}), 500


@app.route("/api/models", methods=["GET"])
def get_models():
    try:
        # Get pagination parameters from request
        page = request.args.get('page', 1, type=int)  # Default to page 1 if not provided
        per_page = request.args.get('per_page', 10, type=int)  # Default to 10 items per page
        
        # Calculate offset and limit
        offset = (page - 1) * per_page
        limit = per_page

        # Query with offset and limit
        total_count = db.session.query(Model).count()  # Get total count of models
        models = db.session.query(Model).offset(offset).limit(limit).all()
        
        # Convert the models to a list of dictionaries
        result = [model.to_json() for model in models]
        
        # Create a pagination response
        response = {
            "models": result,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total_count,
                "total_pages": (total_count + per_page - 1) // per_page  # Ceiling division
            }
        }
        
        return jsonify(response), 200
    except Exception as e:
        print("Error:", str(e))  # For debugging; remove or handle properly in production
        return jsonify({"error": str(e)}), 500
      
@app.route("/api/models/<int:id>", methods=["GET"])
def get_model(id):
    try:
        # Query the model by ID
        model = Model.query.get(id)
        if model is None:
            return jsonify({"error": "Model not found"}), 404
        
        return jsonify(model.to_json()), 200
    except Exception as e:
        print("Error:", str(e))  # For debugging; remove or handle properly in production
        return jsonify({"error": str(e)}), 500


@app.route("/api/models/<int:id>", methods=["PATCH"])
def update_model(id):
    try:
        # Query the model by ID
        model = Model.query.get(id)
        if model is None:
            return jsonify({"error": "Model not found"}), 404
        
        # Extract form data
        data = request.json
        model.name = data.get("name", model.name)
        model.description = data.get("description", model.description)
        model.about_dataset = data.get("about_dataset", model.about_dataset)
        model.best_algorithm = data.get("best_algorithm", model.best_algorithm)
        model.model_type = data.get("model_type", model.model_type)
        model.source_link = data.get("source_link", model.source_link)
        model.features = json.dumps(data.get("features", json.loads(model.features)))
        model.algorithm_used = json.dumps(data.get("algorithm_used", json.loads(model.algorithm_used)))
        
        db.session.commit()
        return jsonify(model.to_json()), 200
    except Exception as e:
        db.session.rollback()
        print("Error:", str(e))  # For debugging; remove or handle properly in production
        return jsonify({"error": str(e)}), 500


@app.route("/api/models/<int:id>", methods=["DELETE"])
def delete_model(id):
    try:
        # Query the model by ID
        model = Model.query.get(id)
        if model is None:
            return jsonify({"error": "Model not found"}), 404
        
        db.session.delete(model)
        db.session.commit()
        return jsonify({"msg": "Model deleted"}), 200
    except Exception as e:
        db.session.rollback()
        print("Error:", str(e))  # For debugging; remove or handle properly in production
        return jsonify({"error": str(e)}), 500
