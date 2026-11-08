# Optimises the master paintings in gen/*.webp into dist/art (see tools/optimize_art.py).
# build.py does this automatically; ingest.py calls this after adding new pictures.
import subprocess, sys, pathlib
subprocess.run([sys.executable, str(pathlib.Path(__file__).parent / 'tools' / 'optimize_art.py')], check=True)
