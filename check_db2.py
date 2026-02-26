from db import Database
import pandas as pd
import json

db = Database()
conn = db.get_connection()
cursor = conn.cursor()

cursor.execute("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Movies'")
cols = [dict(zip([column[0] for column in cursor.description], row)) for row in cursor.fetchall()]

df = pd.read_csv(r"C:\Users\vamsh\Downloads\archive (1)\Data\2024\merged_movies_data_2024.csv")
sample = df.head(1).to_dict('records')

with open('schema.json', 'w') as f:
    json.dump({'columns': cols, 'csv_columns': list(df.columns), 'sample': sample}, f, indent=2)
