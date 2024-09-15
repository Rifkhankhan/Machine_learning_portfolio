
# predict model ,route
# check view file


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
          # Extract form data and files
        data = request.form
      
        
        files = request.files
        # Extract form data
        name = request.form.get("name")
        description = request.form.get("description")
        objectives = request.form.get("objectives")
        data_cleaning = request.form.get("data_cleaning")
        result = request.form.get("result")
        cross_validation = request.form.get("cross_validation")
        about_dataset = request.form.get("about_dataset")
        best_algorithm = request.form.get("best_algorithm")
        model_type = request.form.get("model_type")
        source_link = request.form.get("source_link", None)
        features = request.form.get("features")
        algorithm_used = request.form.get("algorithm_used")
        hyperparameter = request.form.get("hyperparameter")
        feature_creation = request.form.get("feature_creation")

        # Validate required form fields
        required_fields = [
                            "name", 
                           "description", 
                           "about_dataset", 
                           "best_algorithm",
                           "model_type",
                           "features", 
                           "algorithm_used",
                           'cross_validation',
                           'objectives',
                           
                           ]
        missing_fields = [field for field in required_fields if field not in request.form or not request.form.get(field)]

        if missing_fields:
            return jsonify({"error": f"Missing required field(s): {', '.join(missing_fields)}"}), 400
        

        # For example, if "features" is required but exists as an empty list, it should still be considered missing
        empty_fields = [
            field for field in required_fields
            if field in data and not data[field]  # Check in data if field exists but is empty
            
        ]
       
 # Combine missing and empty fields
        invalid_fields = missing_fields + empty_fields
      
          # If there are any invalid fields, you can return an error
        if invalid_fields:
            raise ValueError(f"Missing or empty required fields: {', '.join(invalid_fields)}")
        
        # Validate and parse JSON fields
        def parse_json_field(field_value):
            try:
                return json.loads(field_value) if field_value else []
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON format")

        features_list = parse_json_field(features)
        algorithm_used_list = parse_json_field(algorithm_used)
        data_cleaning_list = parse_json_field(data_cleaning)
        hyperparameter_list = parse_json_field(hyperparameter)
        feature_creation_list = parse_json_field(feature_creation)
        result_list = parse_json_field(result)
     
    
        # Check if 'algorithm_used' list is empty
        if not json.loads(algorithm_used):
            return jsonify({"error": "At least one algorithm must have been used"}), 400
        
      
        # Validate that each item in the list is a non-empty string
        for item in json.loads(algorithm_used):
            if not item.strip():  # Check if the string is empty or contains only whitespace
                return jsonify({"error": "Each algorithm entry must be a non-empty string"}), 400
        
    
        # Validate JSON fields for 'features' and 'algorithm_used'
        try:
            # If the fields are lists, dump them to JSON, otherwise leave them as they are
            if isinstance(features, list):
                features = json.dumps(features)
         
            if isinstance(hyperparameter, list):
                hyperparameter = json.dumps(hyperparameter)
                
            if isinstance(feature_creation, list):
                feature_creation = json.dumps(feature_creation)
                
            if isinstance(algorithm_used, list):
                algorithm_used = json.dumps(algorithm_used)
                
            if isinstance(result, dict):
                result = json.dumps(result)
                
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid JSON format for features "}), 400



        # Validate features list
        def validate_features(features_list):
            for feature in features_list:
                if not all(field in feature and feature[field] for field in ['name', 'datatype', 'desc']):
                    return False
            return True

        def validate_and_clean_features(list,features):
            validate_list = []

            for feature in list:
                # Check if all fields ('name', 'datatype', 'desc') are present and non-empty
                if all(field in feature and feature[field] for field in features):
                    validate_list.append(feature)  # If valid, keep the feature
                # If the object is entirely empty (all fields are missing or empty), skip it
                elif not any(feature[field] for field in features):
                    continue  # Skip the empty feature
                else:
                    # If any field is missing or empty, return error
                    return False, jsonify({"error": "Each Parameter must have non-empty fields"}), 400

            return True, validate_list
        
        def validate_and_clean_result_features(dict_data):
                # Validate result features
                if not isinstance(dict_data, dict):
                    return False, {"error": "Invalid input format, expected a dictionary"}
                if all(value not in [None, ''] for value in dict_data.values()):
                    return True, dict_data
                else:
                    return False, {"error": "All fields in the dictionary must be non-empty"}

           
        
        isValid ,feature_creation_list = validate_and_clean_features(feature_creation_list,features=['name', 'datatype',"desc"])
        if not isValid:
            return jsonify({"error": "Each Feature must have non-empty 'name', 'datatype' fields"}), 400
        
        isValid ,features_list = validate_and_clean_features(features_list,features=['name', 'datatype',"desc"])
        
        if not isValid:
            return jsonify({"error": "Each Feature must have non-empty 'name', 'datatype' fields"}), 400
        
       
        isValid ,hyperparameter_list = validate_and_clean_features(hyperparameter_list,features=['name', 'value'])
       
        if not isValid:
            return jsonify({"error": "Each Parameter must have non-empty 'name', 'value' fields"}), 400
       
        isValid ,result_valid = validate_and_clean_result_features(result_list)
        
     
        if isValid : 
            result_list = result_valid 
         
        if not isValid:
            print(result_valid)
            return jsonify({"error": "Each Feature must have non-empty 'name', 'datatype','desc' fields"}), 400
       
       
        
        # Extract file data
        filename = request.files.get('filename') if 'filename' in request.files else None
        heatmap_image = request.files['heatmap_image']  if 'heatmap_image' in request.files else None
        scalerfile = request.files['scalerfile'] if 'scalerfile' in request.files else None
        encodingfile = request.files['encodingfile'] if 'encodingfile' in request.files else None
        dataset = request.files['dataset'] if 'dataset' in request.files else None
        matrices = request.files['matrices'] if 'matrices' in request.files else None
        confusion_matrices = request.files['confusion_matrices'] if 'confusion_matrices' in request.files else None
        final_matrices = request.files['final_matrices'] if 'final_matrices' in request.files else None
        final_confusion_matrices = request.files['final_confusion_matrices'] if 'final_confusion_matrices' in request.files else None

        # Validate filenames
        if not filename.filename:
            return jsonify({"error": "Invalid file(s)"}), 400

        # File validation rules
        allowed_image_extensions = {'png', 'jpg', 'jpeg'}
        allowed_model_extensions = {'pkl'}
        allowed_dataset_extensions = {'csv'}
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
                error = validate_file(
                    file,
                    allowed_model_extensions if file.filename.endswith('.pkl') 
                    else allowed_dataset_extensions if file.filename.endswith('.csv')  # Example for dataset extensions
                    else allowed_image_extensions
                )

                if error:
                    return jsonify({"error": error}), 400
                file_path = os.path.join(app.config[storage_path], get_timestamped_filename(file.filename))
                file.save(file_path)
                return get_timestamped_filename(file.filename)
            return None

        
        # Save files if they exist, otherwise assign None
        # new_filename = save_file(filename, 'MODEL_FILES') if filename else None
        # new_scalerfile = save_file(scalerfile, 'SCALER_FILES') if scalerfile else None
        # new_encodingfile = save_file(encodingfile, 'ENCODING_FILES') if encodingfile else None
        # new_heatmap_image = save_file(heatmap_image, 'HEATMAP_FILES') if heatmap_image else None
        # new_matrices = save_file(matrices, 'MATRICES_FILES') if matrices else None
        # new_dataset = save_file(dataset, 'DATASET_FILES') if dataset else None
        # new_confusion_matrices = save_file(confusion_matrices, 'CONFUSION_MATRICES_FILES') if confusion_matrices else None
        # new_final_matrices = save_file(final_matrices, 'FINAL_MATRICES_FILES') if final_matrices else None
        # new_final_confusion_matrices = save_file(final_confusion_matrices, 'FINAL_CONFUSION_MATRICES_FILES') if final_confusion_matrices else None
        
        # Create new model instance
        new_model = Model(
            name=name,
            objectives=objectives,
            description=description,
            filename=save_file(filename, 'MODEL_FILES') if filename else None,
            scalerfile= save_file(scalerfile, 'SCALER_FILES') if scalerfile else None,
            result=json.dumps(result_list),
            encodingfile=save_file(encodingfile, 'ENCODING_FILES') if encodingfile else None,
            heatmap_image=save_file(heatmap_image, 'HEATMAP_FILES') if heatmap_image else None,
            matrices=save_file(matrices, 'MATRICES_FILES') if matrices else None,
            final_matrices=save_file(final_matrices, 'FINAL_MATRICES_FILES') if final_matrices else None,
            cross_validation=cross_validation,
            final_confusion_matrices=save_file(final_confusion_matrices, 'FINAL_CONFUSION_MATRICES_FILES') if final_confusion_matrices else None,
            dataset=save_file(dataset, 'DATASET_FILES') if dataset else None,
            confusion_matrices=save_file(confusion_matrices, 'CONFUSION_MATRICES_FILES') if confusion_matrices else None,
            about_dataset=about_dataset,
            best_algorithm=best_algorithm,
            features=json.dumps(features_list),
            hyperparameter=json.dumps(hyperparameter_list),
            feature_creation=json.dumps(feature_creation_list),
            algorithm_used=json.dumps(algorithm_used_list),
            data_cleaning=json.dumps(data_cleaning_list),
            model_type=model_type,
            source_link=source_link
        )
        

        db.session.add(new_model)
        db.session.commit()
        print(new_model)

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
        
         # Validate required form fields
        required_fields = [
                            "name", 
                           "description", 
                           "about_dataset", 
                           "best_algorithm",
                           "model_type",
                           "features", 
                           "algorithm_used",
                           "data_cleaning",
                           'cross_validation',
                           'objectives',
                           
                           ]
        
        # Check if required fields are either missing or empty
        missing_fields = [field for field in required_fields if field not in request.form or not request.form.get(field)]


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
        model.objectives = data.get("objectives", model.objectives)
        model.cross_validation = data.get("cross_validation", model.cross_validation)
       
        model.description = data.get("description", model.description)
        model.about_dataset = data.get("about_dataset", model.about_dataset)
        model.best_algorithm = data.get("best_algorithm", model.best_algorithm)
        model.model_type = data.get("model_type", model.model_type)
        model.source_link = data.get("source_link", model.source_link)
        
        
   
        
        
        def parse_json_field(field_value, name):
            try:
                # Ensure the value is not None and is a string before parsing
                return json.loads(field_value) if field_value and isinstance(field_value, str) else []
            except json.JSONDecodeError:
                raise ValueError(f"Invalid JSON format for {name}")

        features_list = parse_json_field(data.get('features'), 'features')
        hyperparameter_list = parse_json_field(data.get('hyperparameter'), 'hyperparameter')
        feature_creation_list = parse_json_field(data.get('feature_creation'), 'feature_creation')
        result_list = parse_json_field(data.get('result'), 'result')
        
     
        

        def validate_and_clean_features(list, features):
            # Validate and clean features
            validate_list = []

            for feature in list:
                if all(field in feature and feature[field] for field in features):
                    validate_list.append(feature)
                elif not any(feature[field] for field in features):
                    continue
                else:
                    return False, jsonify({"error": "Each parameter must have non-empty fields"}), 400

            return True, validate_list
        
     

        def validate_and_clean_result_features(dict_data):
            # Validate result features
            if not isinstance(dict_data, dict):
                return False, {"error": "Invalid input format, expected a dictionary"}
            if all(value not in [None, ''] for value in dict_data.values()):
                return True, dict_data
            else:
                return False, {"error": "All fields in the dictionary must be non-empty"}

           
        
        isValid ,feature_creation_list = validate_and_clean_features(feature_creation_list,features=['name', 'datatype',"desc"])
        if not isValid:
            return jsonify({"error": "Each Feature must have non-empty 'name', 'datatype','desc' fields"}), 400
        
        
        isValid ,features_list = validate_and_clean_features(features_list,features=['name', 'datatype',"desc"])
        if not isValid:
            return jsonify({"error": "Each Feature must have non-empty 'name', 'datatype' fields"}), 400
        
    
        isValid ,hyperparameter_list = validate_and_clean_features(hyperparameter_list,features=['name', 'value'])
        if not isValid:
            return jsonify({"error": "Each Parameter must have non-empty 'name', 'value' fields"}), 400
        print(result_list)
        
        isValid,result_valid  = validate_and_clean_result_features(result_list)
        print(isValid)
        if isValid : 
            result_list = result_valid 
         
        if not isValid:
            print(result_valid)
            return jsonify({"error": "Each Feature must have non-empty 'name', 'datatype','desc' fields"}), 400
        print(result_list)
   
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
        
          
            if isinstance(data.get('features'), list) and data.get('features'):
                model.features = json.dumps(data.get('features'))
            else:
                model.features = data.get('features')
                
            if isinstance(data.get('hyperparameter'), list) and data.get('hyperparameter'):
                model.hyperparameter = json.dumps(data.get('hyperparameter'))
            else:
                model.hyperparameter = data.get('hyperparameter')
                
            if isinstance(data.get('feature_creation'), list) and data.get('feature_creation'):
                model.feature_creation = json.dumps(data.get('feature_creation'))
            else:
                model.feature_creation = data.get('feature_creation')
                
            if isinstance(data.get('algorithm_used'), list) and data.get('algorithm_used'):
                model.algorithm_used = json.dumps(data.get('algorithm_used'))
            else:
                model.algorithm_used = data.get('algorithm_used')
                
            if isinstance(data.get('result'), dict) and data.get('result'):
                model.result = json.dumps(data.get('result'))
            else:
                model.result = data.get('result')
                
            if isinstance(data.get('data_cleaning'), list) and data.get('data_cleaning'):
                model.data_cleaning = json.dumps(data.get('data_cleaning'))
            else:
                model.data_cleaning = data.get('data_cleaning')
                
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid JSON format for features "}), 400
      
       
        
           # File validation rules
        allowed_image_extensions = {'png', 'jpg', 'jpeg'}
        allowed_model_extensions = {'pkl'}
        allowed_dataset_extensions = {'csv'}
        max_file_size = 10 * 1024 * 1024  # 10 MB limit

        def allowed_file(filename, allowed_extensions):
            return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

        def validate_file(file, allowed_extensions):
            if not allowed_file(file.filename, allowed_extensions):
                return f"File type not allowed: {file.filename}", 400

            # Check file size
            file.seek(0, os.SEEK_END)  # Move pointer to end of file
            file_size = file.tell()
            file.seek(0)  # Reset pointer to start of file

            if file_size > max_file_size:
                return f"File size exceeds limit (10MB): {file.filename}", 400

            return None

        # def get_timestamped_filename(filename):
        #     # Function to get a timestamped filename
        #     timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        #     name, ext = os.path.splitext(filename)
        #     return f"{name}_{timestamp}{ext}"

        def save_file(file, storage_path,existingFileName):
          
            if file:
                # Construct the storage path
                file_path = os.path.join(app.config[storage_path], get_timestamped_filename(file.filename))

                # Validate file
                error = validate_file(
                    file,
                    allowed_model_extensions if file.filename.endswith('.pkl')
                    else allowed_dataset_extensions if file.filename.endswith('.csv')
                    else allowed_image_extensions
                )

                if error:
                    return jsonify({"error": error}), 400

                # Remove existing file if it exists
                if existingFileName:
                    existing_file_path = os.path.join(app.config[storage_path], existingFileName)
                    if os.path.isfile(existing_file_path):
                        os.remove(existing_file_path)

                # Save the new file
                file.save(file_path)
                return get_timestamped_filename(file.filename)
            return None

        # Update model with saved file paths
        model.filename = save_file(files.get('filename'), 'MODEL_FILES', model.filename) if files.get('filename') else model.filename
        model.scalerfile = save_file(files.get('scalerfile'), 'SCALER_FILES',model.scalerfile) if files.get('scalerfile') else model.scalerfile
        model.encodingfile = save_file(files.get('encodingfile'), 'ENCODING_FILES',model.encodingfile) if files.get('encodingfile') else model.encodingfile
        model.heatmap_image = save_file(files.get('heatmap_image'), 'HEATMAP_FILES',model.heatmap_image) if files.get('heatmap_image') else model.heatmap_image
        model.matrices = save_file(files.get('matrices'), 'MATRICES_FILES',model.matrices) if files.get('matrices') else model.matrices
        model.dataset = save_file(files.get('dataset'), 'DATASET_FILES',model.dataset) if files.get('dataset') else model.dataset
        model.confusion_matrices = save_file(files.get('confusion_matrices'), 'CONFUSION_MATRICES_FILES',model.confusion_matrices) if files.get('confusion_matrices') else model.confusion_matrices
        model.final_matrices = save_file(files.get('final_matrices'), 'FINAL_MATRICES_FILES',model.final_matrices) if files.get('final_matrices') else model.final_matrices
        model.final_confusion_matrices = save_file(files.get('final_confusion_matrices'), 'FINAL_CONFUSION_MATRICES_FILES',model.final_confusion_matrices) if files.get('final_confusion_matrices') else model.final_confusion_matrices
        
        # Commit the updated model
        db.session.commit()
        return jsonify(model.to_json()), 200
    except Exception as e:
        db.session.rollback()
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500


def delete_file_if_exists(directory, filename, file_description="File"):
    """Helper function to delete a file if it exists."""
    if filename:
        file_path = os.path.join(directory, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"{file_description} deleted: {file_path}")
        else:
            print(f"{file_description} not found at {file_path}")


def delete_model_files(model):
    """Deletes related files for a given model, such as the model file, scaler, encoding, and heatmap."""
    # Extract the file paths from the model
    model_data = model.to_json()
    
    file_info = [
        (app.config['HEATMAP_FILES'], model_data.get('heatmap_image'), "Heatmap"),
        (app.config['MODEL_FILES'], model_data.get('filename'), "Model"),
        (app.config['SCALER_FILES'], model_data.get('scalerfile'), "Scaler"),
        (app.config['ENCODING_FILES'], model_data.get('encodingfile'), "Encoding")
    ]
    
    # Delete each file if it exists
    for directory, filename, file_description in file_info:
        delete_file_if_exists(directory, filename, file_description)

@app.route("/api/models/<int:id>", methods=["DELETE"])
@require_password
def delete_model(id):
    try:
        # Query the model by ID
        model = Model.query.get(id)
        if model is None:
            return jsonify({"error": "Model not found"}), 404
        
        model_data = model.to_json()
        
        # Extract the file paths from the model
        
        file_info = [
                (app.config['HEATMAP_FILES'], model_data.get('heatmap_image'), "Heatmap"),
                (app.config['MODEL_FILES'], model_data.get('filename'), "Model"),
                (app.config['SCALER_FILES'], model_data.get('scalerfile'), "Scaler"),
                (app.config['ENCODING_FILES'], model_data.get('encodingfile'), "Encoding"),
                (app.config['MATRICES_FILES'], model_data.get('matrices'), "matrices"),
                (app.config['FINAL_MATRICES_FILES'], model_data.get('final_matrices'), "final_matrices"),
                (app.config['DATASET_FILES'], model_data.get('dataset'), "dataset"),
                (app.config['CONFUSION_MATRICES_FILES'], model_data.get('confusion_matrices'), "confusion_matrices"),
                (app.config['FINAL_CONFUSION_MATRICES_FILES'], model_data.get('final_confusion_matrices'), "final_confusion_matrices"),
            ]
        
         # Delete each file if it exists
        for directory, filename, file_description in file_info:
            delete_file_if_exists(directory, filename, file_description)
            
            
        # model_filename = model_data.get('filename')
        # scaler_filename = model_data.get('scalerfile')
        # encoding_filename = model_data.get('encodingfile')
        # heatmap = model_data.get('heatmap_image')
        
        # Delete heatmap file if it exists
        # if heatmap:
        #     heatmap_file_path = os.path.join(app.config['HEATMAP_FILES'], heatmap)
        #     if os.path.exists(heatmap_file_path):
        #         os.remove(heatmap_file_path)
        #     else:
        #         print(f"Model file not found at {heatmap_file_path}")
                
                
        

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
        print('ok')
        # Load the scaler if it exists
        if scaler_filename:
            scaler_file_path = os.path.join(app.config['SCALER_FILES'], scaler_filename)
            if os.path.exists(scaler_file_path):
                scaler = joblib.load(scaler_file_path)
            else:
                print(f"Scaler file not found at {scaler_file_path}")
        
        print('ok')
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
        
        # Ensure that features is a list, and filter out where 'calculate' is True
        features = [feature for feature in features if feature.get('calculate')]
        print(features)
        print(len(features))
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
