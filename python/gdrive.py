from dataclasses import dataclass

import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
# 'metadata.readonly' allows us to see file names and IDs without accessing file contents
SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']


def download_url(drive_id: str) -> str:
    """Direct download URL for Google Drive file"""
    return f"https://drive.google.com/uc?export=download&id={drive_id}"


@dataclass(eq=True, frozen=True)
class File:
    drive_id: str
    name: str


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


def list_files_in_folder(folder_id: str) -> set[File]:
    """Lists files in a Google Drive folder.

    Args:
        folder_id: Get files from this folder.

    Returns a set of Files.
    """
    files: set[File] = set()
    try:
        service = get_drive_service()
        query = f"'{folder_id}' in parents and trashed = false"
        page_token = None

        while True:
            # We pass the page_token to this call. On the first loop, it's None.
            results = service.files().list(
                q=query,
                fields="nextPageToken, files(id, name, mimeType)",
                pageSize=100,  # Grab 100 at a time
                pageToken=page_token
            ).execute()

            for file in results.get("files", []):
                if file["mimeType"] == "application/vnd.google-apps.folder":
                    print(f'Skipping folder {file["name"]}.')
                    continue
                files.add(File(name=file["name"], drive_id=file["id"]))

            # Check if there is another page of data, and if not, we're done.
            page_token = results.get("nextPageToken", None)
            if not page_token:
                break

    except HttpError as error:
        print(f"An error occurred: {error}")

    return files

