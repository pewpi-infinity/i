#!/usr/bin/env python3
"""
Local encoder to base64-encode arbitrary text (PAT or anything else).
Run this on your machine — it does NOT contact the network.

Usage:
  python encode_local.py

It will:
 - prompt you (input hidden) for the text to encode (you can paste a PAT)
 - output the base64-encoded string
 - optionally write server/.env locally with GITHUB_TOKEN_B64=<value> (you choose)
Do NOT commit server/.env to git.
"""
import base64
import getpass
from pathlib import Path

def main():
    print("Local encoder (base64). This runs locally only. Do NOT commit the produced file.")
    secret_in = getpass.getpass("Enter text to encode (input hidden): ").strip()
    if not secret_in:
        print("No input provided, aborting.")
        return

    encoded = base64.b64encode(secret_in.encode('utf-8')).decode('ascii')
    print("\nENCODED (base64):\n")
    print(encoded)
    print("\n---\n")

    choice = input("Write this encoded token to server/.env locally as GITHUB_TOKEN_B64? (y/N): ").strip().lower()
    if choice == 'y':
        server_dir = Path('server')
        server_dir.mkdir(exist_ok=True)
        env_path = server_dir / '.env'
        if env_path.exists():
            confirm = input(f"server/.env exists. Overwrite? (y/N): ").strip().lower()
            if confirm != 'y':
                print("Aborted write.")
                return
        # DO NOT write COMMIT_SECRET here — user should set COMMIT_SECRET locally.
        lines = [
            f"GITHUB_TOKEN_B64={encoded}",
            "# Set COMMIT_SECRET separately in this file (do NOT commit this file).",
            "# COMMIT_SECRET=your_secret_here",
            "PORT=4000"
        ]
        env_path.write_text("\n".join(lines) + "\n", encoding='utf-8')
        print(f"Wrote {env_path.resolve()} (do NOT commit it).")
    else:
        print("OK — copy the encoded value above and paste it into server/.env locally as GITHUB_TOKEN_B64.")

if __name__ == '__main__':
    main()