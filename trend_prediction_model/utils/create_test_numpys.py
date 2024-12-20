"""
This script is only to be run once to preprocess the test data for the model.
The outputs are saved on-disk as NumPy arrays for easy loading in the model.
The '.npy' on-disk files can be found under './trend_prediction_model'.
"""

import sqlite3
import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder, MinMaxScaler

# Define preprocessing parameters
past = 288  # Total past timesteps in raw chunks (2 days)
future = 144  # Total future timesteps in raw chunks (1 day)
sampling_rate = 6  # Sampling rate for sequences
sequence_length = past // sampling_rate  # Effective sequence length
future_steps = future // sampling_rate  # Effective future steps
num_libraries = 5  # Adjust based on your one-hot encoding

# File paths for saving processed test data
test_sequences_path = "./trend_prediction_model/utils/test_sequences.npy"
test_library_inputs_path = "./trend_prediction_model/utils/test_library_inputs.npy"
test_targets_path = "./trend_prediction_model/utils/test_targets.npy"

def preprocess_test_data(path_to_db):
    
    # Get the test data from the database
    conn = sqlite3.connect(path_to_db)
    query = f"""
        SELECT name, year, month, day, chunk, percentage
        FROM BibData
    """
    df = pd.read_sql(query, conn)
    df = df.drop_duplicates().reset_index(drop=True)
    conn.close()

    # Sort the DataFrame by Library, chronologically
    df = df.sort_values(by=['name', 'year', 'month', 'day', 'chunk']).reset_index(drop=True)

    # One-hot encode the library names
    library_names = df['name'].unique().reshape(-1, 1)
    encoder = OneHotEncoder(sparse_output=False)
    one_hot_keys = encoder.fit_transform(library_names)

    # Create the dictionary with one-hot encoded keys
    data_by_library = {
        tuple(one_hot): df[df['name'] == library].drop(columns=['name', 'year', 'month', 'day', 'chunk'])
        for one_hot, library in zip(one_hot_keys, library_names.flatten())
    }

    # Normalize percentage values with min max scaler
    # Because of floating-point operation errors, we round
    for library, data in data_by_library.items():
        scaler = MinMaxScaler()
        data['Occupancy'] = scaler.fit_transform(data['percentage'].values.reshape(-1, 1)).round(2)
        data = data.drop(columns=['percentage'])

    # Update the dictionary with the changed DataFrame
    data_by_library[library] = data

    # Containers for test data
    test_sequences = []
    test_library_inputs = []
    test_targets = []

    for library_key, data in data_by_library.items():
        occupancy = data['Occupancy'].values

        # Generate sequences and targets
        for i in range(0, len(occupancy) - past - future, sampling_rate):
            # Input sequence for past data
            test_sequences.append(occupancy[i:i + past:sampling_rate])
            # One-hot library input
            test_library_inputs.append(library_key)
            # Target sequence for future data
            test_targets.append(occupancy[i + past : i + past + future:sampling_rate])

    # Convert to NumPy arrays
    test_sequences = np.array(test_sequences).reshape(-1, sequence_length, 1)
    test_library_inputs = np.array(test_library_inputs)
    test_targets = np.array(test_targets)

    # Save processed data
    np.save(test_sequences_path, test_sequences)
    np.save(test_library_inputs_path, test_library_inputs)
    np.save(test_targets_path, test_targets)

    print(f"Test data saved to: {test_sequences_path}, {test_library_inputs_path}, {test_targets_path}")

preprocess_test_data("./trend_prediction_model/utils/test_dataset.db")