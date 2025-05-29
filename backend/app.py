from flask import Flask, request, send_file
from flask_cors import CORS
import yt_dlp
import os
import uuid

app = Flask(__name__)
CORS(app)

DOWNLOAD_DIR = "downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

@app.route('/api/download', methods=['POST'])
def download_video():
    data = request.get_json()
    url = data.get("url")
    quality = data.get("quality", "720")  # default to 720p if not provided

    if not url:
        return {"error": "URL is required"}, 400

    video_id = str(uuid.uuid4())
    output_path = os.path.join(DOWNLOAD_DIR, f"{video_id}.mp4")

    ydl_opts = {
        'format': f'bestvideo[height<={quality}][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<={quality}]',
        'merge_output_format': 'mp4',
        'outtmpl': output_path,
        'quiet': True,
        'postprocessors': [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4'
        }]
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        return send_file(output_path, as_attachment=True)
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/info', methods=['POST'])
def get_video_info():
    data = request.get_json()
    url = data.get("url")

    if not url:
        return {"error": "URL is required"}, 400

    try:
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail")
            }
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == "__main__":
    app.run(debug=True)
