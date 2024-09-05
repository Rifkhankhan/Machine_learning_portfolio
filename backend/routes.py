from app import app, db
from flask import request, jsonify
from models import Friend
from datetime import datetime
from models import Model
import os
import joblib
import sklearn
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
        scalerfile = request.files['scalerfile']
        encodingfile = request.files['encodingfile']

        # Validate filenames
        if not filename.filename :
            return jsonify({"error": "Invalid file(s)"}), 400

        # Save files with timestamp in the filename
        filename_path = os.path.join(app.config['MODEL_FILES'], get_timestamped_filename(filename.filename))
        filename.save(filename_path)
        
        if scalerfile :
          scalerfile_path = os.path.join(app.config['SCALER_FILES'], get_timestamped_filename(scalerfile.filename))
          scalerfile.save(scalerfile_path)

        if encodingfile :
          encodingfile_path = os.path.join(app.config['ENCODING_FILES'], get_timestamped_filename(encodingfile.filename))
          encodingfile.save(encodingfile_path)
        
        if heatmap_image :
          heatmap_image_path = os.path.join(app.config['HEATMAP_FILES'], get_timestamped_filename(heatmap_image.filename))
          heatmap_image.save(heatmap_image_path)

    
      

        # Convert features and algorithm_used to JSON
        features_list = json.loads(features)
        algorithm_used_list = json.loads(algorithm_used)

        # Create new model instance
        new_model = Model(
            name=name,
            description=description,
            filename=get_timestamped_filename(filename.filename),
            scalerfile=get_timestamped_filename(scalerfile.filename) if scalerfile else None,
            encodingfile=get_timestamped_filename(encodingfile.filename) if encodingfile else None,
            heatmap_image=get_timestamped_filename(heatmap_image.filename) if heatmap_image else None,
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


@app.route("/api/models/predict", methods=["POST"])
def predict():
    try:
        # Retrieve formData and modelId from the request
        formData = request.json.get("formData")  # Extract formData as a dictionary
        modelId = request.json.get("modelId")    # Extract modelId as a string or int
        print(formData)

        if not modelId or not formData:
            return jsonify({"error": "Model ID and form data are required"}), 400

        # Retrieve the data record from the database using modelId
        data_record = Model.query.get(modelId)  # Replace DataModel with your actual model class
    
        if not data_record:
            return jsonify({"error": "Data record not found"}), 404

        data = data_record.to_json()
       
        # Extract the model filename from the data record
        model_filename = data_record.to_json().get('filename')  # Assuming 'filename' contains the path to the .pkl file
        scaler_filename = data_record.to_json().get('scalerfile')  # Assuming 'scalerfile' contains the path to the scaler .pkl file
        encoding_filename = data_record.to_json().get('encodingfile')  # Assuming 'encodingfile' contains the path to the encoder .pkl file
        
        if not model_filename:
            return jsonify({"error": "Model filename not found in record"}), 500

        # Construct the full path to the model file
        model_file_path = os.path.join(app.config['MODEL_FILES'], model_filename)
        
        scaler = None
        encoder = None
        
        # Load the scaler if it exists
        if scaler_filename:
            scaler_file_path = os.path.join(app.config['SCALER_FILES'], scaler_filename)
            if os.path.exists(scaler_file_path):
                scaler = joblib.load(scaler_file_path)
            else:
                print(f"Scaler file not found at {scaler_file_path}")
        
        # Load the encoder if it exists
        if encoding_filename:
            encoding_file_path = os.path.join(app.config['ENCODING_FILES'], encoding_filename)
            if os.path.exists(encoding_file_path):
                encoder = joblib.load(encoding_file_path)
            else:
                print(f"Encoding file not found at {encoding_file_path}")

        if not os.path.exists(model_file_path):
            return jsonify({"error": "Model file not found"}), 404

        # Get the features field from the record
        features = data_record.to_json().get('features')  # Assuming features is a list of dictionaries
        
        # Load the model from file
        model = joblib.load(model_file_path)

        input_data = []
        for feature in features:
            field_name = feature['name']
            data_type = feature['datatype']
            value = formData.get(field_name)

            if value is None:
                return jsonify({"error": f"Missing data for feature: {field_name}"}), 400

            # Convert value based on data type
            if data_type == 'float':
                value = float(value)
            elif data_type == 'int':
                value = int(value)
            elif data_type == 'string':
                value = str(value)
            else:
                return jsonify({"error": f"Unsupported data type: {data_type}"}), 400

            input_data.append(value)

        # Convert input_data to a 2D array (list of lists) for the model
        input_data = [input_data]
        print(input_data)

        # Apply encoding and scaling if necessary
        if encoder is not None:
            try:
                input_data = encoder.transform(input_data)  # Apply encoder if exists
            except Exception as e:
                return jsonify({"error": f"Encoding error: {str(e)}"}), 500

        if scaler is not None:
            try:
                input_data = scaler.transform(input_data)  # Apply scaler if exists
            except Exception as e:
                return jsonify({"error": f"Scaling error: {str(e)}"}), 500


        print(input_data)
        # Perform the prediction
        prediction = model.predict(input_data)
        print(prediction)

        # Send the prediction result as the response
        return jsonify({"prediction": prediction[0]}), 200

    except Exception as e:
        print("Error:", str(e))  # For debugging purposes
        return jsonify({"error": str(e)}), 500
