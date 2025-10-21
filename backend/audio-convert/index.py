import json
import base64
import io
from typing import Dict, Any
from pydub import AudioSegment

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Convert audio files to WAV stereo format with professional settings
    Args: event - dict with httpMethod, body (base64 encoded audio file)
          context - object with request_id, function_name
    Returns: HTTP response with converted WAV file in base64
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-File-Name',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = event.get('body', '')
    
    if not body_data:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'No audio data provided'})
        }
    
    try:
        audio_bytes = base64.b64decode(body_data)
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Invalid base64 encoding: {str(e)}'})
        }
    
    audio_buffer = io.BytesIO(audio_bytes)
    
    try:
        audio = AudioSegment.from_file(audio_buffer)
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Invalid audio file: {str(e)}'})
        }
    
    original_channels = audio.channels
    original_sample_rate = audio.frame_rate
    original_duration = len(audio) / 1000.0
    
    if audio.channels == 1:
        audio = audio.set_channels(2)
    
    audio = audio.set_frame_rate(44100)
    
    audio = audio.set_sample_width(2)
    
    output_buffer = io.BytesIO()
    audio.export(
        output_buffer,
        format='wav',
        parameters=['-acodec', 'pcm_s16le']
    )
    output_buffer.seek(0)
    
    wav_base64 = base64.b64encode(output_buffer.read()).decode('utf-8')
    
    duration_seconds = len(audio) / 1000.0
    minutes = int(duration_seconds // 60)
    seconds = int(duration_seconds % 60)
    duration_str = f"{minutes}:{seconds:02d}"
    
    file_size_mb = len(output_buffer.getvalue()) / (1024 * 1024)
    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'audio': wav_base64,
            'duration': duration_str,
            'durationSeconds': round(duration_seconds, 2),
            'format': 'WAV Stereo',
            'sampleRate': 44100,
            'channels': 2,
            'bitDepth': 16,
            'fileSizeMB': round(file_size_mb, 2),
            'original': {
                'channels': original_channels,
                'sampleRate': original_sample_rate,
                'duration': round(original_duration, 2)
            }
        })
    }
