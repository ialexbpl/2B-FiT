# AI Backend Setup

This directory contains the Python backend for the AI features of the 2B-FiT app.

## Prerequisites

1.  **Python 3.8+** installed.
2.  **Hugging Face Token**: You need a valid token in your `.env` file.

## Setup

1.  **Install Dependencies**:
    Navigate to the project root and run:
    ```bash
    pip install -r ai/requirements.txt
    ```

2.  **Environment Variables**:
    Ensure your `.env` file in the project root has the following variable:
    ```
    HF_TOKEN=your_hugging_face_token_here
    ```

## Running the Server

**Option 1 (Easy):**
Double-click the `start_ai.bat` file in the project root.

**Option 2 (Manual):**
Run the following command from the project root:

```bash
python -m uvicorn ai.api:app --host 0.0.0.0 --port 8000 --reload
```

The server will start at `http://0.0.0.0:8000`.

## Connecting the App

The React Native app tries to connect to the server on port `8000`.
- If running on **Android Emulator**, it uses `10.0.2.2`.
- If running on **iOS Simulator**, it uses `localhost`.
- If running on a **Physical Device**, ensure your phone and computer are on the same Wi-Fi, and the app attempts to connect to your computer's local IP (e.g., `192.168.x.x`).

> **Note**: If you are a new developer, you might need to update the IP address in `src/screens/AI/AI.tsx` if the automatic detection doesn't work for your network setup.
