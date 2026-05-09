"""Run pipeline.json against books.csv and write books-modern.csv."""

from frictionless import Pipeline, transform

pipeline = Pipeline.from_descriptor("pipeline.json")
result = transform("books.csv", pipeline=pipeline)
result.write("books-modern.csv")
print("wrote books-modern.csv")
