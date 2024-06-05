import csv
import json
from collections import defaultdict
import os
import logging
from typing import List, Dict, Any, Tuple

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class DataParser:
    def __init__(self, health_expenditure_csv_path: str, perceived_health_status_csv_path: str):
        self.health_expenditure_csv_path = health_expenditure_csv_path
        self.perceived_health_status_csv_path = perceived_health_status_csv_path

    def csv_to_dict(self, csv_file_path: str, key_fields: List[str], multi_field: str = None) -> Dict[Tuple[str, str], Dict[str, Any]]:
        data_dict = defaultdict(lambda: defaultdict(dict))
        
        if not os.path.exists(csv_file_path):
            logging.error(f"File not found: {csv_file_path}")
            return data_dict

        try:
            with open(csv_file_path, mode='r', encoding='utf-8-sig') as csv_file:
                csv_reader = csv.DictReader(csv_file)
                for row in csv_reader:
                    key = tuple(row[field] for field in key_fields)
                    row = {k: (v if v else None) for k, v in row.items()}
                    if multi_field and multi_field in row:
                        category = row[multi_field]
                        data_dict[key][category] = row
                    else:
                        data_dict[key].update(row)
        except Exception as e:
            logging.exception(f"Error reading CSV file: {e}")
        
        return data_dict

    def merge_dictionaries(self, dict1: Dict[Tuple[str, str], Dict[str, Any]], dict2: Dict[Tuple[str, str], Dict[str, Any]], rename_map1: Dict[str, str], rename_map2: Dict[str, str], group_by: str = 'year') -> Dict[str, Dict[str, Any]]:
        merged_dict = defaultdict(lambda: defaultdict(dict))
        all_keys = set(dict1.keys()).union(set(dict2.keys()))

        for key in all_keys:
            value1 = {rename_map1.get(k, k): v for k, v in dict1.get(key, {}).items()}
            value2 = {rename_map2.get(k, k): v for k, v in dict2.get(key, {}).items()}
            merged_value = {**value1, **value2}

            # Remove unwanted fields
            merged_value.pop('Health status value', None)
            merged_value.pop('Health status', None)
            
            # Keep only relevant fields and clean up the nested structure
            filtered_value = {
                'Country': merged_value.get('Country'),
                'Year': merged_value.get('Year'),
                'GDP': merged_value.get('GDP'),
                'Fair (not good, not bad) health': merged_value.get('Fair (not good, not bad) health', {}).get('OBS_VALUE'),
                'Good/very good health': merged_value.get('Good/very good health', {}).get('OBS_VALUE'),
                'Bad/very bad health': merged_value.get('Bad/very bad health', {}).get('OBS_VALUE')
            }

            # Remove null values
            filtered_value = {k: v for k, v in filtered_value.items() if v is not None}
            
            # Ensure at least one health value exists
            if any(k in filtered_value for k in ['Fair (not good, not bad) health', 'Good/very good health', 'Bad/very bad health']):
                if group_by == 'year':
                    year = key[1]
                    country = key[0]
                    merged_dict[year][country] = filtered_value
                elif group_by == 'country':
                    year = key[1]
                    country = key[0]
                    merged_dict[country][year] = filtered_value
        
        return merged_dict

    def save_dict_to_json(self, data_dict: Dict[str, Dict[str, Any]], json_file_path: str):
        try:
            with open(json_file_path, mode='w', encoding='utf-8') as json_file:
                json.dump(data_dict, json_file, indent=4, ensure_ascii=False)
            logging.info(f"Data successfully saved to {json_file_path}")
        except Exception as e:
            logging.exception(f"Error saving JSON file: {e}")

# Example usage:
parser = DataParser('Health expenditure and financing.csv', 'Perceived health status.csv')

# Convert CSV files to dictionaries with composite keys
health_expenditure_dict = parser.csv_to_dict(parser.health_expenditure_csv_path, key_fields=['Reference area', 'TIME_PERIOD'])
perceived_health_status_dict = parser.csv_to_dict(parser.perceived_health_status_csv_path, key_fields=['Reference area', 'TIME_PERIOD'], multi_field='Health status')

# Rename maps for clearer variable names
health_expenditure_rename_map = {
    "Reference area": "Country",
    "TIME_PERIOD": "Year",
    "OBS_VALUE": "GDP"
}

perceived_health_status_rename_map = {
    "Reference area": "Country",
    "TIME_PERIOD": "Year",
    "OBS_VALUE": "Health status value",
    "Health status": "Health status",
    "Fair (not good, not bad) health": "Fair (not good, not bad) health",
    "Good/very good health": "Good/very good health",
    "Bad/very bad health": "Bad/very bad health"
}

# Merge the dictionaries categorized by year
merged_data_dict_by_year = parser.merge_dictionaries(
    health_expenditure_dict, 
    perceived_health_status_dict, 
    health_expenditure_rename_map, 
    perceived_health_status_rename_map,
    group_by='year'
)

# Merge the dictionaries categorized by country
merged_data_dict_by_country = parser.merge_dictionaries(
    health_expenditure_dict, 
    perceived_health_status_dict, 
    health_expenditure_rename_map, 
    perceived_health_status_rename_map,
    group_by='country'
)

# Save the merged dictionaries to JSON files
parser.save_dict_to_json(merged_data_dict_by_year, 'Merged_health_data_by_year.json')
parser.save_dict_to_json(merged_data_dict_by_country, 'Merged_health_data_by_country.json')

# Display snippets of the merged JSON data
merged_data_snippet_by_year = {year: list(data.keys())[:1] for year, data in merged_data_dict_by_year.items()}
merged_data_snippet_by_country = {country: list(data.keys())[:1] for country, data in merged_data_dict_by_country.items()}
logging.info("Merged data snippet by year: %s", merged_data_snippet_by_year)
logging.info("Merged data snippet by country: %s", merged_data_snippet_by_country)

