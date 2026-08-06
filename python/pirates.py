import core
import gdrive
import cockatrice
import gsheets_new as gsn
import gdrive


SHEET_ID = "1ovssKGvjC4TDobRoCf4yw-S6V4pa87xtPMdatQ9EQ_g"
RENDERS_ID = "1cpUI9DW2VpxxN4ODszBqEa2Nk2_ts5ZY"

SHEETS = set(
        (
            "White",
            "Blue",
            "Black",
            "Red",
            "Green",
            "Treasure",
            "Colorless",
            "Land",
            "Multi",
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
                    setcode="TOKS",
                ),
        )
    render_files = gdrive.list_files_in_folder(folder_id=RENDERS_ID)
    cockatrice.export_cockatrice_xml(
            cards=cards,
            renders={f.name: gdrive.download_url(drive_id=f.drive_id) for f in render_files},
            set_filename="toks.xml",
            set_code="TOKS",
            set_long_name="Treasures of Kao Sora",
            date_string=date_string,
    )
