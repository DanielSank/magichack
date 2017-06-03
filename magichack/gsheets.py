"""Utility library for manipulating Google Sheets.

To use this, you need to first enable the Sheets API and create a JSON
credentials file. This should be saved in your home directory @
~/.google_drive_oauth.json.

Please follow the instructions here:
    https://developers.google.com/sheets/api/quickstart/python
"""
from __future__ import print_function


import httplib2
import logging
import os
import pandas
import string

from apiclient import discovery
from oauth2client import client
from oauth2client import tools
from oauth2client.file import Storage

# If modifying these scopes, delete your previously saved credentials
# at ~/.credentials/drive-credentials.json

# This grants full access to Drive:
HOME = os.path.expanduser('~')
CREDENTIALS_DIR = os.path.join(HOME, '.gsheets-credentials')
SCOPES = 'https://www.googleapis.com/auth/spreadsheets'
CLIENT_SECRET_FILE = 'google_sheets_secret.json'  # in home directory
APPLICATION_NAME = 'magichack'


class SheetsLibException(Exception):
    """Main Sheets Exception."""

    def __init__(self, parent_exception, error=''):
        self.error = error
        self.parent_exception = parent_exception

    def __getattr__(self, attr):
        return getattr(self.parent_exception, attr)

    def __str__(self):
        if self.error:
            return self.error
        else:
            return unicode(self.parent_exception)


class SheetsReadException(SheetsLibException):
    """Error Reading Sheets."""
    pass


class SheetsWriteException(SheetsLibException):
    """Error Writing Sheets."""
    pass


class SheetsClient(object):
    """Client for Accessing Sheets."""

    def __init__(self):
        self.service = self._get_sheets_service()

    def read_range(self,
                   spreadsheet_id,
                   spreadsheet_range,
                   read_type='UNFORMATTED_VALUE'):
        """Returns a range of data from a spreadsheet.

        Args:
            spreadsheet_id (str): The Drive file ID.
            spreadsheet_range (str): A block from the spreadsheet in standard
                spreadsheet format, e.g. "A1:B5" is all cells between and
                including A1 and B5 (5 rows and 2 columns).
            read_type (str): One of the following options:
                'FORMATTED_VALUE': if the cell's value is 1.2345, but it's
                    formatted as currency, this will return the str "$1.23".
                'UNFORMATTED_VALUE': the raw, calculated value.
                'FORMULA': the uncalculated value, with formulas.

        Returns:
            List of list of values. If you provide "A1:B2" (a 2x2 block of
            cells), you will get a list:
                    [ [r1c1, r1c2],
                      [r2c1, r2c2] ]
        """
        try:
            data = (self.service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=spreadsheet_range,
                valueRenderOption=read_type).execute())
            return data['values']
        except Exception as exc:
            raise SheetsReadException(exc)

    def write_range(self,
                    spreadsheet_id,
                    spreadsheet_range,
                    rows,
                    write_type='RAW'):
        """Writes data to a spreadsheet.

        Args:
            spreadsheet_id (str): The Drive file ID
            spreadsheet_range (str): A block from the spreadsheet in standard
                    spreadsheet format, e.g. "A1:B5" is all cells between and
                    including A1 and B5 (5 rows and 2 columns)
            rows (list[list[str]]):
                    List of list of values. For e.g. "A1:B2" (a 2x2 block of
                    cells), you should provide:
                      [ [r1c1, r1c2],
                        [r2c1, r2c2] ]
            write_type (str): Either:
                'RAW': Values are stored as-is.
                'USER_ENTERED': Enter it as if the user typed it in -- use this
                    for e.g. entering formulas.

        Returns:
            Nothing.
        """

        request = {
            'majorDimension': 'ROWS',
            'range': spreadsheet_range,
            'values': rows,
        }

        try:
            self.service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range=spreadsheet_range,
                valueInputOption=write_type,
                body=request).execute()
        except Exception as exc:
            raise SheetsWriteException(exc)

    def _get_credentials(self):
        """Get user credentials from storage.

        If nothing has been stored, or if the stored credentials are invalid,
        the OAuth2 flow is completed to obtain the new credentials.

        Returns:
            Credentials, the obtained credential.
        """
        if not os.path.exists(CREDENTIALS_DIR):
            os.makedirs(CREDENTIALS_DIR)
        credential_path = os.path.join(
                CREDENTIALS_DIR,
                'sheets-credentials.json')
        store = Storage(credential_path)
        credentials = store.get()
        client_secret_file = os.path.join(
                HOME,
                '.magichack',
                CLIENT_SECRET_FILE)
        if not credentials or credentials.invalid:
            flow = client.flow_from_clientsecrets(client_secret_file, SCOPES)
            flow.user_agent = APPLICATION_NAME
            credentials = tools.run_flow(flow, store)
            logging.info('Storing credentials to ' + credential_path)
        return credentials

    def _get_sheets_service(self):
        """Get Google Drive API service wrapper."""
        credentials = self._get_credentials()
        http = credentials.authorize(httplib2.Http())
        discovery_url = ('https://sheets.googleapis.com/$discovery/rest?'
                         'version=v4')
        service = discovery.build(
            'sheets',
            'v3',
            http=http,
            discoveryServiceUrl=discovery_url)
        return service


def column_index_to_letter(column):
    """Convert 0-index column number to the spreadsheet column.

    For example, 'A' -> 0, 'B' -> 2, .., 'AA' -> 26, 'AB' -> 27, etc. This is
    basically a decimal to base-26 converter.

    Args:
        column (int): column index

    Returns:
        str: Converted column index.
    """
    s = ''
    letters = string.ascii_uppercase

    while True:
        s = letters[column % 26] + s
        column = column / 26.0
        if column < 1:
            break
        column = int(column - 1)

    return s


def column_letter_to_index(col_letter):
    """Convert column names (A, ZZ, BAC, etc.) to 0-indexed column number.

    For example, 0 -> 'A', 1 -> 'B', ..., 26 -> 'AA', 27 -> 'AB', etc.

    Args:
        col_letter (str): The spreadsheet-style column header.

    Returns:
        int: Index corresponding to given letter(s).
    """
    column_index = 0
    column_position = 0

    while col_letter:
        column_num = ord(col_letter[-1]) - ord('A') + 1
        column_index += (26**column_position) * column_num
        col_letter = col_letter[:-1]
        column_position += 1

    return column_index - 1


class SingleSheet(object):
    """A handle to a single Google sheet."""

    def __init__(self, sheet_id, client_factory=SheetsClient):
        self.client = client_factory()
        self.sheet_id = sheet_id

    def read_range(self, sheet_range):
        """See SheetsClient.read_range."""
        return self.client.read_range(self.sheet_id, sheet_range)

    def read_range_as_DataFrame(self, sheet_range):
        """Like read_range but returns a Pandas DataFrame.

        Args:
            sheet_range (str): See SheetsClient.read_range.

        The first row of the spreadsheet is assumed to be the column names.
        """
        data = self.client.read_range(self.sheet_id, sheet_range)
        headers = data.pop(0)
        return pandas.DataFrame(data, columns=headers)
