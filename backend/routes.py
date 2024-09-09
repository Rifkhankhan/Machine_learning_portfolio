# update feilds validation check


from app import app, db
from flask import request, jsonify
from models import Friend
from datetime import datetime
from sqlalchemy import desc
from models import Model
import os
import joblib
import sklearn
import json
from models import Feature

from functools import wraps

# Set the secret password from environment variable or use a default one
SECRET_PASSWORD = os.getenv('SECRET_PASSWORD', 'default_password')



def check_password(password):
    return password == SECRET_PASSWORD

def require_password(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get the password from the form data
        password = request.form.get('password')
        print(password)
        
        # Check if the password is correct
        if not check_password(password):
            return jsonify({"error": "Unauthorized"}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function


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
@require_password
def create_model():
    try:
        # Check if files are present
        if 'filename' not in request.files:
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
        filename = request.files.get('filename') if 'filename' in request.files else None
        heatmap_image = request.files['heatmap_image']  if 'heatmap_image' in request.files else None
        scalerfile = request.files['scalerfile'] if 'scalerfile' in request.files else None
        encodingfile = request.files['encodingfile'] if 'encodingfile' in request.files else None

        # Validate filenames
        if not filename.filename:
            return jsonify({"error": "Invalid file(s)"}), 400

        # File validation rules
        allowed_image_extensions = {'png', 'jpg', 'jpeg'}
        allowed_model_extensions = {'pkl'}
        max_file_size = 10 * 1024 * 1024  # 10 MB limit

        def allowed_file(filename, allowed_extensions):
            return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

        def validate_file(file, allowed_extensions):
            if not allowed_file(file.filename, allowed_extensions):
                return f"File type not allowed: {file.filename}", 400
            if len(file.read()) > max_file_size:
                return f"File size exceeds limit (10MB): {file.filename}", 400
            file.seek(0)  # Reset file pointer after size check

        # Save files with timestamp in the filename
        def save_file(file, storage_path):
            if file:
                error = validate_file(file, allowed_model_extensions if file.filename.endswith('.pkl') else allowed_image_extensions)
                if error:
                    return jsonify({"error": error}), 400
                file_path = os.path.join(app.config[storage_path], get_timestamped_filename(file.filename))
                file.save(file_path)
                return get_timestamped_filename(file.filename)
            return None

       

        # Validate and parse JSON fields
        def parse_json_field(field_value):
            try:
                return json.loads(field_value) if field_value else []
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON format")

        features_list = parse_json_field(features)
        algorithm_used_list = parse_json_field(algorithm_used)

        # Validate features list
        def validate_features(features_list):
            for feature in features_list:
                if not all(field in feature and feature[field] for field in ['name', 'datatype', 'desc']):
                    return False
            return True

        if not validate_features(features_list):
            return jsonify({"error": "Each feature must have non-empty 'name', 'datatype', and 'desc' fields"}), 400
        
        # Save files if they exist, otherwise assign None
        new_filename = save_file(filename, 'MODEL_FILES') if filename else None
        new_scalerfile = save_file(scalerfile, 'SCALER_FILES') if scalerfile else None
        new_encodingfile = save_file(encodingfile, 'ENCODING_FILES') if encodingfile else None
        new_heatmap_image = save_file(heatmap_image, 'HEATMAP_FILES') if heatmap_image else None
        
        # Create new model instance
        new_model = Model(
            name=name,
            description=description,
            filename=new_filename,
            scalerfile=new_scalerfile,
            encodingfile=new_encodingfile,
            heatmap_image=new_heatmap_image,
            about_dataset=about_dataset,
            best_algorithm=best_algorithm,
            features=json.dumps(features_list),
            algorithm_used=json.dumps(algorithm_used_list),
            model_type=model_type,
            source_link=source_link
        )

        db.session.add(new_model)
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
        models = db.session.query(Model).order_by(desc(Model.created_at)).offset(offset).limit(limit).all()
  
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
@require_password
def update_model(id):
    try:
        # Query the model by ID
        model = Model.query.get(id)
        if model is None:
            return jsonify({"error": "Model not found"}), 404
        
         # Extract form data and files
        data = request.form
      
        
        files = request.files
        
         # Validation for required fields
        required_fields = ["name", "description", "about_dataset", "best_algorithm", "model_type", "features", "algorithm_used"]
     
        
        # Check if required fields are either missing or empty
        missing_fields = [
            field for field in required_fields
            if not data.get(field) and not model.__dict__.get(field)
        ]

        # For example, if "features" is required but exists as an empty list, it should still be considered missing
        empty_fields = [
            field for field in required_fields
            if field in data and not data[field]  # Check in data if field exists but is empty
            or field in model.__dict__ and not model.__dict__[field]  # Check in model's attributes for empty values
        ]
        

        # Combine missing and empty fields
        invalid_fields = missing_fields + empty_fields
      

        # If there are any invalid fields, you can return an error
        if invalid_fields:
            raise ValueError(f"Missing or empty required fields: {', '.join(invalid_fields)}")
        
        # Update model fields if new values are provided
        model.name = data.get("name", model.name)
        model.description = data.get("description", model.description)
        model.about_dataset = data.get("about_dataset", model.about_dataset)
        model.best_algorithm = data.get("best_algorithm", model.best_algorithm)
        model.model_type = data.get("model_type", model.model_type)
        model.source_link = data.get("source_link", model.source_link)
        
        
         # Validate and parse JSON fields
        def parse_json_field(field_value):
            try:
                return json.loads(field_value) if field_value else []
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON format")

        features_list = parse_json_field(data.get('features'))
     
        

        # Validate features list
        def validate_features(features_list):
            for feature in features_list:
                if not all(field in feature and feature[field] for field in ['name', 'datatype', 'desc']):
                    return False
            return True

        if not validate_features(features_list):
            return jsonify({"error": "Each feature must have non-empty 'name', 'datatype', and 'desc' fields"}), 400
        
        
      
        # Check if 'algorithm_used' list is empty
        if not json.loads(data.get('algorithm_used')):
            return jsonify({"error": "At least one algorithm must have been used"}), 400
        
        # Validate that each item in the list is a non-empty string
        for item in json.loads(data.get('algorithm_used')):
            if not item.strip():  # Check if the string is empty or contains only whitespace
                return jsonify({"error": "Each algorithm entry must be a non-empty string"}), 400
    
      # Validate JSON fields for 'features' and 'algorithm_used'
        try:
            # If the fields are lists, dump them to JSON, otherwise leave them as they are
            if isinstance(data.get("features"), list):
                model.features = json.dumps(data["features"])
            else:
                model.features = data.get("features", model.features)
            
            if isinstance(data.get("algorithm_used"), list):
                model.algorithm_used = json.dumps(data["algorithm_used"])
            else:
                model.algorithm_used = data.get("algorithm_used", model.algorithm_used)
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid JSON format for features or algorithm_used"}), 400


       
        
        # File validation rules
        allowed_image_extensions = {'png', 'jpg', 'jpeg'}
        allowed_model_extensions = {'pkl'}
        max_file_size = 10 * 1024 * 1024  # 10 MB limit

        def allowed_file(filename, allowed_extensions):
            return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

        def validate_file(file, allowed_extensions):
            if not allowed_file(file.filename, allowed_extensions):
                return f"File type not allowed: {file.filename}", 400
            if len(file.read()) > max_file_size:
                return f"File size exceeds limit (10MB): {file.filename}", 400
            file.seek(0)  # Reset file pointer after size check

        # Handle file updates with specific validation
        if 'filename' in files:
            # Validate for .pkl file
            error = validate_file(files['filename'], allowed_model_extensions)
            if error:
                return jsonify({"error": error}), 400
            # Delete old model file and save the new one
            if model.filename:
                old_file_path = os.path.join(app.config['MODEL_FILES'], model.filename)
                if os.path.exists(old_file_path):
                    os.remove(old_file_path)
            filename = files['filename']
            filename_path = os.path.join(app.config['MODEL_FILES'], get_timestamped_filename(filename.filename))
            filename.save(filename_path)
            model.filename = get_timestamped_filename(filename.filename)

        if 'scalerfile' in files:
            # Validate for .pkl file
            error = validate_file(files['scalerfile'], allowed_model_extensions)
            if error:
                return jsonify({"error": error}), 400
            # Delete old scaler file and save the new one
            if model.scalerfile:
                old_scaler_path = os.path.join(app.config['SCALER_FILES'], model.scalerfile)
                if os.path.exists(old_scaler_path):
                    os.remove(old_scaler_path)
            scalerfile = files['scalerfile']
            scalerfile_path = os.path.join(app.config['SCALER_FILES'], get_timestamped_filename(scalerfile.filename))
            scalerfile.save(scalerfile_path)
            model.scalerfile = get_timestamped_filename(scalerfile.filename)

        if 'encodingfile' in files:
            # Validate for .pkl file
            error = validate_file(files['encodingfile'], allowed_model_extensions)
            if error:
                return jsonify({"error": error}), 400
            # Delete old encoding file and save the new one
            if model.encodingfile:
                old_encoding_path = os.path.join(app.config['ENCODING_FILES'], model.encodingfile)
                if os.path.exists(old_encoding_path):
                    os.remove(old_encoding_path)
            encodingfile = files['encodingfile']
            encodingfile_path = os.path.join(app.config['ENCODING_FILES'], get_timestamped_filename(encodingfile.filename))
            encodingfile.save(encodingfile_path)
            model.encodingfile = get_timestamped_filename(encodingfile.filename)

        if 'heatmap_image' in files:
            # Validate for image file (png, jpg, jpeg)
            error = validate_file(files['heatmap_image'], allowed_image_extensions)
            if error:
                return jsonify({"error": error}), 400
            # Delete old heatmap image and save the new one
            if model.heatmap_image:
                old_heatmap_path = os.path.join(app.config['HEATMAP_FILES'], model.heatmap_image)
                if os.path.exists(old_heatmap_path):
                    os.remove(old_heatmap_path)
            heatmap_image = files['heatmap_image']
            heatmap_image_path = os.path.join(app.config['HEATMAP_FILES'], get_timestamped_filename(heatmap_image.filename))
            heatmap_image.save(heatmap_image_path)
            model.heatmap_image = get_timestamped_filename(heatmap_image.filename)

        # Commit the updated model
        db.session.commit()
        return jsonify(model.to_json()), 200
    except Exception as e:
        db.session.rollback()
        print("Error:", str(e))  # For debugging; remove or handle properly in production
        return jsonify({"error": str(e)}), 500


@app.route("/api/models/<int:id>", methods=["DELETE"])
@require_password
def delete_model(id):
    try:
        # Query the model by ID
        model = Model.query.get(id)
        if model is None:
            return jsonify({"error": "Model not found"}), 404
        
        # Extract the file paths from the model
        model_data = model.to_json()
        model_filename = model_data.get('filename')
        scaler_filename = model_data.get('scalerfile')
        encoding_filename = model_data.get('encodingfile')
        heatmap = model_data.get('heatmap_image')
        
        # Delete heatmap file if it exists
        if heatmap:
            heatmap_file_path = os.path.join(app.config['HEATMAP_FILES'], heatmap)
            if os.path.exists(heatmap_file_path):
                os.remove(heatmap_file_path)
            else:
                print(f"Model file not found at {heatmap_file_path}")
                
                
         # Delete model file if it exists
        if model_filename:
            model_file_path = os.path.join(app.config['MODEL_FILES'], model_filename)
            if os.path.exists(model_file_path):
                os.remove(model_file_path)
            else:
                print(f"Model file not found at {model_file_path}")

        # Delete scaler file if it exists
        if scaler_filename:
            scaler_file_path = os.path.join(app.config['SCALER_FILES'], scaler_filename)
            if os.path.exists(scaler_file_path):
                os.remove(scaler_file_path)
            else:
                print(f"Scaler file not found at {scaler_file_path}")

        # Delete encoding file if it exists
        if encoding_filename:
            encoding_file_path = os.path.join(app.config['ENCODING_FILES'], encoding_filename)
            if os.path.exists(encoding_file_path):
                os.remove(encoding_file_path)
            else:
                print(f"Encoding file not found at {encoding_file_path}")

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
            # Get the specific transformer for categorical columns (assuming the name is 'encoder')
            categorical_encoder = encoder.named_transformers_.get('encoder')
            try:
               # Check if it's an OneHotEncoder or LabelEncoder
                if hasattr(categorical_encoder, 'categories_'):
                    # If it's an OneHotEncoder, retrieve the categories
                    categories = categorical_encoder.categories_[0]
                    
                elif hasattr(categorical_encoder, 'classes_'):
                    # If it's a LabelEncoder, retrieve the classes
                    categories = categorical_encoder.classes_[0]
                  
                input_data = encoder.transform(input_data)  # Apply encoder if exists
                
            except Exception as e:
                return jsonify({"error": f"Encoding error: {str(e)}.  \n The categories are {categories}"}), 500


        print(scaler)
        # Get the specific transformer for numerical columns (assuming the name is 'scaler')
        if scaler is not None:
      
            try:
                input_data = scaler.transform(input_data)  # Apply scaler if exists
                
            except Exception as e:
                return jsonify({"error": f"Scaling error: {str(e)} "}), 500


        print(input_data)
        # Perform the prediction
        prediction = model.predict(input_data)
        print(prediction)

        # Send the prediction result as the response
        return jsonify({"prediction": prediction[0].tolist()})  # Convert to a list of native Python types}), 200

    except Exception as e:
        print("Error:", str(e))  # For debugging purposes
        return jsonify({"error": str(e)}), 500
