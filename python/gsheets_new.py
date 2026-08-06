import os
import csv

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

import core
from core import Rarity, Cost


# If modifying these scopes, delete the file token.json.
SCOPES = [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/drive.metadata.readonly",
]


def get_gsheet_rows(spreadsheet_id: str, range_name: str) -> list[list[str]] | None:
    """Fetch Google Sheets data.

    Args:
        spreadsheet_id:
        range_name:

    Returns a list of sheet rows. Each row is a list of strings, i.e. contents of
        that row's cells.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first time.
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    try:
        print("fetching...")
        service = build("sheets", "v4", credentials=creds)

        # Call the Sheets API
        sheet = service.spreadsheets()
        result = (
            sheet.values()
            .get(spreadsheetId=spreadsheet_id, range=range_name)
            .execute()
        )
        return result.get("values", [])

    except HttpError as err:
        print(f"An API error occurred: {err}")
        return None


def parse_pt(pt: str) -> int | str | None:
    if pt == "":
        return None
    else:
        try:
            return int(pt)
        except ValueError:
            return pt


def parse_gsheet_rows(
        rows: list[list[str]],
        setcode: str,
) -> list[core.Card]:
    # Format the gsheet rows a bit before creating Cards.
    column_names = rows[0]
    formatted: list[dict[str, str | list[str]]] = []
    for row in rows[1:]:
        d: dict[str, str] = {}
        types: list[str] = []
        for name, val in zip(column_names, row):
            if name == "Type":
                if val:
                    types.append(val)
            else:
                d[name] = val
        d["Type"] = "\n".join(types)
        formatted.append(d)

    cards: list[core.Card] = []
    for row in formatted:
        if row.get("Name", "") == "":
            continue
        cards.append(
                core.Card(
                    sset=setcode,
                    rarity=Rarity.from_string(row["Rarity"]),
                    legendary=True if row["Legendary"] == "TRUE" else False,
                    types=tuple(row["Type"].split("\n")),
                    subtypes=tuple(row["Subtypes"].split("\n")),
                    classes=tuple(row["Classes"].split("\n")),
                    power=parse_pt(row["P"]),
                    toughness=parse_pt(row["T"]),
                    cost=Cost.from_str(row["Cost"]),
                    rules=tuple(row["Rules"].split("\n")),
                    name=row["Name"],
                    flavor=row.get("Flavor", ""),
                    image_url=row["Image"] if row.get("Image", None) else None,
                )
        )
    return cards

