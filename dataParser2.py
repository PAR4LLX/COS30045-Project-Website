import csv
import json
from collections import defaultdict
import os
import logging
from typing import List, Dict, Any, Tuple

# Set up logging to display information and errors
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class DataParser:
    def __init__(self, working_age_population_csv_path: str, employment_by_activity_csv_path: str):
        # Initialize the paths for the CSV files
        self.working_age_population_csv_path = working_age_population_csv_path
        self.employment_by_activity_csv_path = employment_by_activity_csv_path

    def csv_to_dict(self, csv_file_path: str, key_fields: List[str], multi_field: str = None) -> Dict[Tuple[str, str], Dict[str, Any]]:
        # Create a dictionary to hold the CSV data
        data_dict = defaultdict(lambda: defaultdict(dict))
        
        # Check if the CSV file exists
        if not os.path.exists(csv_file_path):
            logging.error(f"File not found: {csv_file_path}")
            return data_dict

        try:
            # Open and read the CSV file
            with open(csv_file_path, mode='r', encoding='utf-8-sig') as csv_file:
                csv_reader = csv.DictReader(csv_file)
                for row in csv_reader:
                    # Create a key using specified fields (e.g., country and year)
                    key = tuple(row[field] for field in key_fields)
                    # Remove empty values from the row
                    row = {k: (v if v else None) for k, v in row.items()}
                    # If a multi_field is specified, categorize data under that field
                    if multi_field and multi_field in row:
                        category = row[multi_field]
                        data_dict[key][category] = row
                    else:
                        data_dict[key].update(row)
        except Exception as e:
            logging.exception(f"Error reading CSV file: {e}")
        
        return data_dict

    def combine_dicts(self, dict1: Dict[Tuple[str, str], Dict[str, Any]], dict2: Dict[Tuple[str, str], Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        # Create a dictionary to hold the combined data
        combined_dict = defaultdict(lambda: defaultdict(dict))
        
        # Combine data from both dictionaries where keys (country and year) match
        for key in dict1.keys() & dict2.keys():
            country, year = key
            population_value = dict1[key].get('OBS_VALUE')
            employment_value = dict2[key].get('OBS_VALUE')
            # Only include data if both population and employment values are present
            if population_value and employment_value:
                combined_dict[year][country] = {
                    'population': population_value,
                    'employment': employment_value
                }
        
        return combined_dict

    def save_dict_to_json(self, data_dict: Dict[str, Dict[str, Any]], json_file_path: str):
        try:
            # Ensure the directory exists
            os.makedirs(os.path.dirname(json_file_path), exist_ok=True)
            # Save the data dictionary to a JSON file
            with open(json_file_path, mode='w', encoding='utf-8') as json_file:
                json.dump(data_dict, json_file, indent=4, ensure_ascii=False)
            logging.info(f"Data successfully saved to {json_file_path}")
        except Exception as e:
            logging.exception(f"Error saving JSON file: {e}")

# Paths for the CSV files (assume they are in the current directory)
working_age_population_csv_path = './Working-age population.csv'
employment_by_activity_csv_path = './Annual employment by detailed economic activity, domestic concept.csv'

# Create a DataParser instance
parser = DataParser(working_age_population_csv_path, employment_by_activity_csv_path)

# Convert CSV files to dictionaries with composite keys
working_age_population_dict = parser.csv_to_dict(working_age_population_csv_path, key_fields=['Reference area', 'TIME_PERIOD'])
employment_by_activity_dict = parser.csv_to_dict(employment_by_activity_csv_path, key_fields=['Reference area', 'TIME_PERIOD'], multi_field='Activity')

# Combine the dictionaries
combined_dict = parser.combine_dicts(working_age_population_dict, employment_by_activity_dict)

# Save the combined dictionary to a JSON file in the current directory
combined_json_path = './Combined_data_by_year.json'
parser.save_dict_to_json(combined_dict, combined_json_path)

# Print the path of the saved JSON file
print(f"Combined data saved to {combined_json_path}")

