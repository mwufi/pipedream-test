

# Signing in with Pipedream button

How it works:
- When you click "Connect with Google", it:
- Fetches a connect token from your API using a test user ID
- Creates a Pipedream frontend client
- Initiates the Google Sheets connection flow
- Shows real-time status updates

On successful connection:
- Displays the connected account ID
- Shows account name if available
- Provides a "Test Another Connection" button to reset

The connection uses your existing backend setup with proper environment variables for Pipedream credentials.