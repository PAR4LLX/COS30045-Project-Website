import csv  # Import the csv module for reading CSV files
import json  # Import the json module for writing JSON files
from collections import defaultdict  # Import defaultdict for creating nested dictionaries
import os  # Import os module for checking file existence

def csv_to_dict(csv_file_path, key_fields):
    """
    Convert a CSV file to a dictionary with composite keys.

    :param csv_file_path: Path to the CSV file
    :param key_fields: List of column names to use as composite keys
    :return: Dictionary with composite keys
    """
    # Initialize a nested dictionary to store the data
    data_dict = defaultdict(lambda: defaultdict(dict))
    
    # Check if the file exists
    if not os.path.exists(csv_file_path):
        print(f"File not found: {csv_file_path}")
        return data_dict
    
    # Open and read the CSV file
    with open(csv_file_path, mode='r', encoding='utf-8-sig') as csv_file:
        csv_reader = csv.DictReader(csv_file)  # Create a CSV reader object
        for row in csv_reader:
            # Create a composite key from the specified fields
            key = tuple(row[field] for field in key_fields)
            # Replace empty fields with None
            row = {k: (v if v else None) for k, v in row.items()}
            # Update the dictionary with the row data
            data_dict[key].update(row)
    return data_dict

def merge_dictionaries_by_year(dict1, dict2, rename_map1, rename_map2):
    """
    Merge two dictionaries with optional key renaming and categorize by year.

    :param dict1: First dictionary to merge
    :param dict2: Second dictionary to merge
    :param rename_map1: Key renaming map for the first dictionary
    :param rename_map2: Key renaming map for the second dictionary
    :return: Merged dictionary grouped by year
    """
    # Initialize a nested dictionary to store the merged data
    merged_dict = defaultdict(lambda: defaultdict(dict))
    
    # Get all unique keys from both dictionaries
    all_keys = set(dict1.keys()).union(set(dict2.keys()))
    
    for key in all_keys:
        # Rename keys and get values from both dictionaries
        value1 = {rename_map1.get(k, k): v for k, v in dict1.get(key, {}).items()}
        value2 = {rename_map2.get(k, k): v for k, v in dict2.get(key, {}).items()}
        merged_value = {**value1, **value2}
        
        # Check if GDP is present and not empty
        if 'GDP' in merged_value and merged_value['GDP'] is not None:
            # Ensure all expected keys are present
            for rename_map in [rename_map1, rename_map2]:
                for original_key, renamed_key in rename_map.items():
                    if renamed_key not in merged_value:
                        merged_value[renamed_key] = None
            
            # Extract year and country from the key
            year = key[1]  # Assuming the second element of the key tuple is the year
            country = key[0]  # Assuming the first element of the key tuple is the country
            # Update the merged dictionary with the merged value
            merged_dict[year][country] = merged_value
    
    return merged_dict

def merge_dictionaries_by_country(dict1, dict2, rename_map1, rename_map2):
    """
    Merge two dictionaries with optional key renaming and categorize by country.

    :param dict1: First dictionary to merge
    :param dict2: Second dictionary to merge
    :param rename_map1: Key renaming map for the first dictionary
    :param rename_map2: Key renaming map for the second dictionary
    :return: Merged dictionary grouped by country
    """
    # Initialize a nested dictionary to store the merged data
    merged_dict = defaultdict(lambda: defaultdict(dict))
    
    # Get all unique keys from both dictionaries
    all_keys = set(dict1.keys()).union(set(dict2.keys()))
    
    for key in all_keys:
        # Rename keys and get values from both dictionaries
        value1 = {rename_map1.get(k, k): v for k, v in dict1.get(key, {}).items()}
        value2 = {rename_map2.get(k, k): v for k, v in dict2.get(key, {}).items()}
        merged_value = {**value1, **value2}
        
        # Check if GDP is present and not empty
        if 'GDP' in merged_value and merged_value['GDP'] is not None:
            # Ensure all expected keys are present
            for rename_map in [rename_map1, rename_map2]:
                for original_key, renamed_key in rename_map.items():
                    if renamed_key not in merged_value:
                        merged_value[renamed_key] = None
            
            # Extract year and country from the key
            year = key[1]  # Assuming the second element of the key tuple is the year
            country = key[0]  # Assuming the first element of the key tuple is the country
            # Update the merged dictionary with the merged value
            merged_dict[country][year] = merged_value
    
    return merged_dict

def save_dict_to_json(data_dict, json_file_path):
    """
    Save a dictionary to a JSON file.

    :param data_dict: Dictionary to save
    :param json_file_path: Path to the JSON file
    """
    # Open the JSON file and write the dictionary data to it
    with open(json_file_path, mode='w', encoding='utf-8') as json_file:
        json.dump(data_dict, json_file, indent=4, ensure_ascii=False)

# File paths for the input CSV files and output JSON files
health_expenditure_csv_path = 'Health expenditure and financing.csv'
perceived_health_status_csv_path = 'Perceived health status.csv'
output_json_path_by_year = 'Merged_health_data_by_year.json'
output_json_path_by_country = 'Merged_health_data_by_country.json'

# Convert CSV files to dictionaries with composite keys
health_expenditure_dict = csv_to_dict(health_expenditure_csv_path, key_fields=['Reference area', 'TIME_PERIOD'])
perceived_health_status_dict = csv_to_dict(perceived_health_status_csv_path, key_fields=['Reference area', 'TIME_PERIOD'])

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
    "Health status": "Health status"
}

# Merge the dictionaries categorized by year
merged_data_dict_by_year = merge_dictionaries_by_year(
    health_expenditure_dict, 
    perceived_health_status_dict, 
    health_expenditure_rename_map, 
    perceived_health_status_rename_map
)

# Merge the dictionaries categorized by country
merged_data_dict_by_country = merge_dictionaries_by_country(
    health_expenditure_dict, 
    perceived_health_status_dict, 
    health_expenditure_rename_map, 
    perceived_health_status_rename_map
)

# Save the merged dictionaries to JSON files
save_dict_to_json(merged_data_dict_by_year, output_json_path_by_year)
save_dict_to_json(merged_data_dict_by_country, output_json_path_by_country)

# Display snippets of the merged JSON data
merged_data_snippet_by_year = {year: list(data.keys())[:1] for year, data in merged_data_dict_by_year.items()}
merged_data_snippet_by_country = {country: list(data.keys())[:1] for country, data in merged_data_dict_by_country.items()}
print("Merged data snippet by year:", merged_data_snippet_by_year)
print("Merged data snippet by country:", merged_data_snippet_by_country)

