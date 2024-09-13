from app import db
from flask_sqlalchemy import SQLAlchemy
import json
import datetime

class Friend(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  name = db.Column(db.String(100), nullable=False)
  role = db.Column(db.String(50), nullable=False)
  description = db.Column(db.Text, nullable=False)
  gender = db.Column(db.String(10), nullable=False)
  img_url = db.Column(db.String(200), nullable=True)


  def to_json(self):
    return {
      "id":self.id,
      "name":self.name,
      "role":self.role,
      "description":self.description,
      "gender":self.gender,
      "imgUrl":self.img_url,
    }



class Feature(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    datatype = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)

class Model(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  name = db.Column(db.String(100), nullable=False)
  filename = db.Column(db.String(255), nullable=False)  # Increased length
  scalerfile = db.Column(db.String(255), nullable=True)
  
  objectives = db.Column(db.String(255), nullable=True)
  cross_validation = db.Column(db.Float(precision=3), nullable=True)
  
  data_cleaning = db.Column(db.Text, nullable=True)
  
  hyperparameter = db.Column(db.Text, nullable=True)
  feature_creation = db.Column(db.Text, nullable=True)
  result = db.Column(db.Text, nullable=True)  # Store JSON as string
  
  matrices = db.Column(db.Text, nullable=True)
  dataset = db.Column(db.String(255), nullable=True)
  confusion_matrices = db.Column(db.Text, nullable=True)
  final_matrices = db.Column(db.Text, nullable=True)
  final_confusion_matrices = db.Column(db.Text, nullable=True)
  encodingfile = db.Column(db.String(255), nullable=True)
  
  about_dataset = db.Column(db.Text, nullable=False)
  features = db.Column(db.Text, nullable=False)  # Store JSON as string
  description = db.Column(db.Text, nullable=False)
  heatmap_image = db.Column(db.String(200), nullable=True)
  algorithm_used = db.Column(db.Text, nullable=False)  # Store JSON as string
  best_algorithm = db.Column(db.String(100), nullable=True)
  model_type = db.Column(db.Text, nullable=False)
  source_link = db.Column(db.String(200), nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
  updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

  def to_json(self):
      
      
      return {
          "id": self.id,
          "name": self.name ,
          "description": self.description if self.description  else  "",
          "objectives": self.objectives if self.objectives  else  "",
          "filename": self.filename if self.filename else None,
          "scalerfile": self.scalerfile if self.scalerfile else None,
          "matrices": self.matrices if self.matrices else None,
          "final_matrices": self.final_matrices if self.final_matrices else None,
          "cross_validation": self.cross_validation if self.cross_validation  else  "",
          "hyperparameter":  json.loads(self.hyperparameter) if self.hyperparameter else [],
          "confusion_matrices": self.confusion_matrices,
          "final_confusion_matrices": self.final_confusion_matrices,
          "encodingfile": self.encodingfile if self.encodingfile else None,
          "heatmap_image": self.heatmap_image if self.heatmap_image else None,
          "about_dataset": self.about_dataset if self.about_dataset  else  "",
          "dataset": self.dataset if self.dataset else None,
          "best_algorithm": self.best_algorithm if self.best_algorithm  else  "",
          "features": json.loads(self.features) if self.features else [],
          "result": json.loads(self.result) if self.result else [],
          "feature_creation": json.loads(self.feature_creation) if self.feature_creation  else [],
          "data_cleaning": json.loads(self.data_cleaning) if self.data_cleaning else [],
          "algorithm_used": json.loads(self.algorithm_used) if self.algorithm_used else [],
          "model_type": self.model_type if self.model_type  else  "",
          "source_link": self.source_link if self.source_link  else  ""
      }


  @property
  def features_list(self):
      return json.loads(self.features) if self.features else []
  
  @features_list.setter
  def features_list(self, value):
      self.features = json.dumps(value)
  
  @property
  def algorithm_used_list(self):
      return json.loads(self.algorithm_used) if self.algorithm_used else []
  
  @algorithm_used_list.setter
  def algorithm_used_list(self, value):
      self.algorithm_used = json.dumps(value)
  
  @property
  def model_type_list(self):
      return json.loads(self.model_type) if self.model_type else []
  
  @model_type_list.setter
  def model_type_list(self, value):
      self.model_type = json.dumps(value)
      
      
      

# Example Usage:
# Creating an Entry:

# new_dataset = DatasetModel(
#     name="Student Performance Dataset",
#     about_dataset="The Student Performance Dataset is designed to evaluate and predict student outcomes based on various factors...",
#     features_list=["StudentID", "Name", "Gender", "AttendanceRate", "StudyHoursPerWeek", "PreviousGrade", "ExtracurricularActivities", "ParentalSupport"],
#     algorithm_used_list=["Linear Regression", "Decision Trees"],
#     model_type_list=["Regression"],
#     source_link="https://www.kaggle.com/datasets/example-dataset",
# )

# db.session.add(new_dataset)
# db.session.commit()

# Retrieving Data:
# dataset = DatasetModel.query.get(1)
# features = dataset.features_list  # This will be a list
# algorithm_used = dataset.algorithm_used_list  # This will be a list
# model_type = dataset.model_type_list  # This will be a list
# source_link = dataset.source_link  # This will be a string
