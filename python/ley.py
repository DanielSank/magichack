import core
import gdrive
import cockatrice
import gsheets_new as gsn
import gdrive


SHEET_ID = "1ST7Z8v6KOgjoNoxoxjRtzvO5mkQ5Mn7gIva8HXCT-m0"
RENDERS_ID = "10ITQ4mo3MpG1Ein_JlXv3JnTxdhqWDnR"

SHEETS = set(
        (
            "Inst/Sorc",
            "Enchantment",
            "Creatures",
            "Artifact",
            "Land",
        )
)


def main(date_string: str) -> None:
    cards: list[core.Card] = []
    for sheet in SHEETS:
        rows = gsn.get_gsheet_rows(
                spreadsheet_id=SHEET_ID,
                range_name=f"{sheet}!A1:M",
        )
        print(f"Found {len(rows)} rows in sheet {sheet}.")
        cards.extend(
                gsn.parse_gsheet_rows(
                    rows=rows,
                    setcode="LEY",
                ),
        )
    render_files = gdrive.list_files_in_folder(folder_id=RENDERS_ID)
    cockatrice.export_cockatrice_xml(
            cards=cards,
            renders={f.name: gdrive.download_url(drive_id=f.drive_id) for f in render_files},
            set_filename="ley.xml",
            set_code="LEY",
            set_long_name="Limited Edition Yellow",
            date_string=date_string,
    )
