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
  filename = db.Column(db.String(100), nullable=False)
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
          "name": self.name,
          "description": self.description,
          "filename": self.filename,
          "heatmap_image": self.heatmap_image,
          "about_dataset": self.about_dataset,
          "best_algorithm": self.best_algorithm,
          "features": json.loads(self.features),
          "algorithm_used": json.loads(self.algorithm_used),
          "model_type": self.model_type,
          "source_link": self.source_link
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
