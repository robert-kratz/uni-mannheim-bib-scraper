# %% [markdown]
# # Roadmap
# ### - [DONE] Create primitive model, predicting for only one library (A3)
# ### - [DONE] Create model for all libraries
# 
# 1. **multi-input: whole dataset + encoded library name => BEST COMPROMISE (faster than the others bc only one model trained and no need to model inter-dependencies => good if we get 5% mae)**
# 2. data of one library + data of all libraries as inputs => better prediction for one library that accounts for inter-dependencies, BUT extremely computationally expensive (more inputs and more models) => overhead, not worth implementing 
# 
# ### - [DONE] Tweak model to improve its accuracy
# ### - [DONE] Create pipeline for receiving data in real-time, once a day, and update the model after training
# ### - 'Integrate' model into the website
# 
# ### Adjust 'past' parameter eventually in the coming releases

# %% [markdown]
# ### Imports

# %%
import tracemalloc
tracemalloc.start()

import sqlite3

import pandas as pd
import numpy as np

from sklearn.preprocessing import OneHotEncoder, MinMaxScaler

import tensorflow as tf
import tensorflowjs as tfjs

from tensorflow.keras.models import Model, load_model
from tensorflow.keras.layers import Input, GRU, Dense, Concatenate, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.callbacks import ReduceLROnPlateau

import os
import csv
import time
import datetime

# %% [markdown]
# ### Fetch the data

# %%
conn = sqlite3.connect("./prisma/dev.db")

def fetch_latest_data():
    query = f"""
        SELECT name, year, month, day, chunk, percentage
        FROM BibData
    """
    df = pd.read_sql(query, conn)
    return df

df = fetch_latest_data()
df = df.drop_duplicates().reset_index(drop=True)

conn.close()

# %% [markdown]
# ### Preprocess data into a dictionary with encoded libraries and their occupancy percentages

# %%
# Sort the DataFrame by Library, chronologically
df = df.sort_values(by=['name', 'year', 'month', 'day', 'chunk']).reset_index(drop=True)

# One-hot encode the library names
library_names = df['name'].unique().reshape(-1, 1)
encoder = OneHotEncoder(sparse_output=False)
one_hot_keys = encoder.fit_transform(library_names)

for one_hot, library in zip(one_hot_keys, library_names.flatten()):
    print(f"{library} => {one_hot}")

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

# %% [markdown]
# ### Define timeseries parameters

# %%
# We look 2 days in the past (2 days x 24 hours x 6 chunks = 288 chunks)
past = 288

# We want to predict the next day (1 day x 24 hours x 6 chunks = 144 chunks)
future = 144

# We sample data every hour - look at it every 6 chunks within the (past, future) timeframe
# We do this to reduce the amount of data to process to a manageable size
sampling_rate = 6

# Define the sequence length:
# We actually look at 288 / 6 = 48 timesteps in the past (48 points of past data)
sequence_length = int(past / sampling_rate)

# Same for the future steps:
# We actually look at 144 / 6 = 24 timesteps in the future (24 hours)
future_steps = int(future / sampling_rate)

# Save number of libraries
num_libraries = len(encoder.categories_[0])  # Number of unique libraries

# 80% train, 20% validation
# Note that there is no test data, since we do not actually know the future values to test against
split_fraction = 0.8

# Get train split index for all dataframes
train_split = [int(split_fraction * len(df)) for df in data_by_library.values()]

# %% [markdown]
# ### Prepare data for training

# %%
# Train and validation data containers
train_sequences = []
val_sequences = []
train_library_inputs = []
val_library_inputs = []
train_targets = []
val_targets = []

# Process each library
for (library_key, data), train_idx in zip(data_by_library.items(), train_split):

    # Split into training and validation sets
    occupancy = data['Occupancy'].values
    train_values = occupancy[:train_idx]
    val_values = occupancy[train_idx:]

    # Generate training sequences
    for i in range(0, len(train_values) - past - future, sampling_rate):
        # Input sequence for past data
        train_sequences.append(train_values[i:i + past:sampling_rate])
        train_library_inputs.append(library_key)
        # Target sequence for future data
        train_targets.append(train_values[i + past : i + past + future:sampling_rate])

    # Generate validation sequences
    for i in range(0, len(val_values) - past - future, sampling_rate):
        # Input sequence for past data
        val_sequences.append(val_values[i:i + past:sampling_rate])
        val_library_inputs.append(library_key)
        # Target sequence for future data
        val_targets.append(val_values[i + past : i + past + future:sampling_rate])

# Convert lists to NumPy arrays
train_sequences = np.array(train_sequences).reshape(-1, sequence_length, 1)
val_sequences = np.array(val_sequences).reshape(-1, sequence_length, 1)
train_library_inputs = np.array(train_library_inputs)
val_library_inputs = np.array(val_library_inputs)
train_targets = np.array(train_targets)
val_targets = np.array(val_targets)

# %% [markdown]
# ### Build a multi-input, multi-output model

# %%
# Define multi-input GRU model
def build_multi_input_model(sequence_length, num_libraries, future_steps):
    seq_input = Input(shape=(sequence_length, 1), name="sequence_input")

    x = GRU(64, activation="tanh", return_sequences = True, reset_after = False)(seq_input)
    x = Dropout(0.4)(x)
    x = GRU(32, activation="tanh", return_sequences = False, reset_after = False)(x)

    lib_input = Input(shape=(num_libraries,), name="library_input")
    combined = Concatenate()([x, lib_input])

    x = Dense(128, activation="relu")(combined)
    output = Dense(future_steps, name="output")(x)

    model = Model(inputs=[seq_input, lib_input], outputs=output)
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.01), loss="mse", metrics=["mae"])
    return model


# Filepath to save the model
model_save_path = "./trend_prediction_model/base_model.h5"

# Check if a previous model already exists
try:
    # Load the model if it exists
    model = load_model(model_save_path)
    print("Loaded model from previous training.")
except:
    # Build a new model if no saved model is found
    print("No saved model found. Building a new model...")
    model = build_multi_input_model(sequence_length, num_libraries, future_steps)


# %%
# COMMENT IF RUNNING ON ONLY A COUPLE OF EPOCHS - defining callbacks

early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

learning_rate_reduction = ReduceLROnPlateau(
    monitor='val_loss', factor=0.2, patience=2, min_lr=1e-5
)

# %% [markdown]
# ### Train and validate
# RNNs usually slow, computationally expensive: calculations are done sequentially, it all depends on the previous output => no parallelization possible

# %%
training_start_time = time.time()

history = model.fit(
    [train_sequences, train_library_inputs],
    train_targets,
    validation_data=([val_sequences, val_library_inputs], val_targets),
    epochs = 100,
    batch_size = 32,
    callbacks=[early_stopping, learning_rate_reduction]
)

training_end_time = time.time()

# %% [markdown]
# ### Save the model

# %%
# Save the trained model
model.save(model_save_path)
tfjs.converters.save_keras_model(model, "./trend_prediction_model/tfjs_model")
print(f"Model updated to {model_save_path}.")

# %% [markdown]
# ### Evaluate on the test dataset

# %%
# Load test data
test_sequences = np.load("./trend_prediction_model/utils/test_sequences.npy")
test_library_inputs = np.load("./trend_prediction_model/utils/test_library_inputs.npy")
test_targets = np.load("./trend_prediction_model/utils/test_targets.npy")

# Evaluate the model
results = model.evaluate(
    [test_sequences, test_library_inputs],
    test_targets,
    batch_size=32
)

# Calculate performance metrics
test_loss, test_mae = model.evaluate([test_sequences, test_library_inputs], test_targets, verbose=1)

# %% [markdown]
# ### Log the results

# %%
# Log file path
log_file = "./trend_prediction_model/model_logging.csv"

# Initialize the log file if it doesn't exist
if not os.path.exists(log_file):
    with open(log_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Timestamp", "Data Size (rows)", "Memory Peak Usage (MB)", "Training Duration (m)", "Validation Loss", "Validation MAE (%)", "Test MAE (%)"])

# Function to log updates
def log_update(data_size, training_duration, val_loss, val_mae, test_mae):
    
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d @ %H:%M:%S")
    
    # Get current and peak memory usage
    current, peak = tracemalloc.get_traced_memory()
    peak = peak / 1024 ** 2
    peak = round(peak, 2)

    with open(log_file, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([timestamp, data_size, peak, training_duration, val_loss, val_mae, test_mae])
    
    tracemalloc.stop()

# Log the results
log_update(
    len(df),
    training_duration = round(int(training_end_time - training_start_time) / 60, 2),
    val_loss = round(history.history['val_loss'][-1], 3),
    val_mae = round(history.history['val_mae'][-1] * 100, 2),
    test_mae = round(test_mae * 100, 2)
)

tf.keras.backend.clear_session()
