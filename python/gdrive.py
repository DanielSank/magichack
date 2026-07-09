import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
# 'metadata.readonly' allows us to see file names and IDs without accessing file contents
SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']


def get_drive_service():
    """Handles authentication and returns the Drive API service object."""
    creds = None
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return build('drive', 'v3', credentials=creds)


def list_files_in_folder(folder_id):
    """Lists every single file inside a specific Google Drive folder using pagination."""
    try:
        service = get_drive_service()

        query = f"'{folder_id}' in parents and trashed = false"
        print(f"Fetching all files from folder ID: {folder_id}...\n")
        
        # Print the header
        print(f"{'File Name':<40} | {'File ID'}")
        print("-" * 80)
        
        page_token = None
        total_files = 0

        while True:
            # We pass the page_token to this call. On the first loop, it's None.
            results = service.files().list(
                q=query,
                fields="nextPageToken, files(id, name, mimeType)",
                pageSize=100,  # Grab 100 at a time
                pageToken=page_token
            ).execute()
            
            files = results.get('files', [])
            
            for file in files:
                is_folder = " [FOLDER]" if file['mimeType'] == 'application/vnd.google-apps.folder' else ""
                print(f"{file['name'] + is_folder:<40} | {file['id']}")
                total_files += 1

            # Check if there is another page of data
            page_token = results.get('nextPageToken', None)
            
            # If there's no nextPageToken, we've reached the end
            if not page_token:
                break

        print("-" * 80)
        print(f"Done! Found a total of {total_files} files.")

    except HttpError as error:
        print(f"An error occurred: {error}")

