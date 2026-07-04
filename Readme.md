
                              ░▒▓████████▓▒░▒▓███████▓▒░░▒▓█▓▒░░▒▓██████▓▒░░▒▓██████████████▓▒░ ░▒▓██████▓▒░  
                              ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
                              ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
                              ░▒▓██████▓▒░ ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒▒▓███▓▒░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░ 
                              ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
                              ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
                              ░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
                                                                                
                                                                                
                                                  ___________________☺__________________
                                                        ||                    ||
                                                ♥ ************************************** ♥
                                                ♥ *                                    * ♥
                                                ♥ *     HIGH SPEED FILE DOWNLOADER     * ♥
                                                ♥ *                                    * ♥
                                                ♥ ************************************** ♥

How To Install?

1. clone GitHub repo.

       git clone https://github.com/Cyber-Ghost-2008/HSFDL

2. Navigate to folder HSFDL.

       cd HSFDL

3. Install requirements.

       pip install -r requirements.txt

4. Run the downloader.

       python main.py

Optional arguments example:

       python main.py --url "https://www.youtube.com/watch?v=..." --format MP3 --quality 720p --output-dir "C:\Downloads" --cookies cookies.json

Optional:
- If a website requires login or cookies, place a supported `cookies.txt` or `cookies.json` file in the project folder.
- You can pass a cookies path with `--cookies <file>` when running `main.py`.
- For YouTube downloads, install Node.js if you see JavaScript runtime warnings.

Notes:
- `main.py` is the CLI application entrypoint.
- The app prints a colorized terminal interface and uses a progress bar for downloads.
- `setup.py` can install dependencies with `python setup.py`, but `pip install -r requirements.txt` is enough.
