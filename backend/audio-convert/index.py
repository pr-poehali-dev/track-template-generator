import json
import base64
import io
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Professional audio conversion to WAV Stereo 44.1kHz 16-bit format
    Args: event - dict with httpMethod, body (base64 encoded audio)
          context - object with request_id, function_name
    Returns: HTTP response with professional WAV file
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
            'body': json.dumps({'error': 'No audio data'})
        }
    
    try:
        audio_bytes = base64.b64decode(body_data)
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Invalid encoding: {str(e)}'})
        }
    
    try:
        import soundfile as sf
        import numpy as np
    except ImportError as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Missing library: {str(e)}'})
        }
    
    audio_buffer = io.BytesIO(audio_bytes)
    
    try:
        data, original_sr = sf.read(audio_buffer, dtype='float32')
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Invalid audio: {str(e)}'})
        }
    
    original_channels = 1 if len(data.shape) == 1 else data.shape[1]
    original_duration = len(data) / original_sr
    
    if len(data.shape) == 1:
        data = np.stack([data, data], axis=1)
    elif data.shape[1] == 1:
        data = np.concatenate([data, data], axis=1)
    elif data.shape[1] > 2:
        data = data[:, :2]
    
    target_sr = 44100
    if original_sr != target_sr:
        num_samples = int(len(data) * target_sr / original_sr)
        resampled = np.zeros((num_samples, 2), dtype=np.float32)
        for ch in range(2):
            resampled[:, ch] = np.interp(
                np.linspace(0, len(data) - 1, num_samples),
                np.arange(len(data)),
                data[:, ch]
            )
        data = resampled
    
    peak = np.abs(data).max()
    if peak > 0:
        data = data / peak * 0.95
    
    output_buffer = io.BytesIO()
    sf.write(
        output_buffer,
        data,
        target_sr,
        subtype='PCM_16',
        format='WAV'
    )
    
    output_buffer.seek(0)
    wav_base64 = base64.b64encode(output_buffer.read()).decode('utf-8')
    
    duration_seconds = len(data) / target_sr
    minutes = int(duration_seconds // 60)
    seconds = int(duration_seconds % 60)
    duration_str = f"{minutes}:{seconds:02d}"
    
    output_buffer.seek(0)
    file_size_mb = len(output_buffer.read()) / (1024 * 1024)
    
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
                'sampleRate': int(original_sr),
                'duration': round(original_duration, 2)
            }
        })
    }
