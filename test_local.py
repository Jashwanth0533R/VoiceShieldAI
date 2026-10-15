import requests
import json
import sys

URL = "http://127.0.0.1:5000/analyze"
audio_file_path = r"D:\SIH\merge_m1_n_m2\frontend\mock\mock_voice_result.json" # not real audio, wait.
# Actually I need a real flac file to send
import glob
files = glob.glob(r"D:\SIH\Member 2\dataset\**\*.flac", recursive=True)
if not files:
    print("No flac files found for testing.")
    sys.exit(1)

test_file = files[0]
print(f"Testing with file: {test_file}")

with open(test_file, "rb") as f:
    files_payload = {'audio': f}
    response = requests.post(URL, files=files_payload)
    print("Status:", response.status_code)
    try:
        data = response.json()
        print(json.dumps(data, indent=2))
    except Exception as e:
        print("Response:", response.text)
