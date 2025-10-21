import json
import base64
import io
import wave
import struct
from typing import Dict, Any

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
    
    try:
        import numpy as np
    except ImportError:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'NumPy not available'})
        }
    
    audio_buffer = io.BytesIO(audio_bytes)
    
    try:
        with wave.open(audio_buffer, 'rb') as wav_in:
            nchannels = wav_in.getnchannels()
            sampwidth = wav_in.getsampwidth()
            framerate = wav_in.getframerate()
            nframes = wav_in.getnframes()
            audio_data = wav_in.readframes(nframes)
    except:
        try:
            import soundfile as sf
            audio_buffer.seek(0)
            data, samplerate = sf.read(audio_buffer)
            if len(data.shape) == 1:
                data = np.column_stack((data, data))
            elif data.shape[1] == 1:
                data = np.column_stack((data, data))
            
            nchannels = 2
            framerate = samplerate
            nframes = len(data)
            audio_data = (data * 32767).astype(np.int16).tobytes()
        except Exception as e:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': f'Invalid audio file: {str(e)}'})
            }
    
    original_channels = nchannels
    original_sample_rate = framerate
    original_duration = nframes / framerate
    
    samples = np.frombuffer(audio_data, dtype=np.int16)
    
    if nchannels == 1:
        samples = np.repeat(samples, 2)
        nchannels = 2
    elif nchannels == 2:
        pass
    else:
        samples = samples[:len(samples) // nchannels * 2].reshape(-1, nchannels)[:, :2].flatten()
        nchannels = 2
    
    if framerate != 44100:
        num_samples = int(len(samples) * 44100 / framerate)
        samples = np.interp(
            np.linspace(0, len(samples) - 1, num_samples),
            np.arange(len(samples)),
            samples
        ).astype(np.int16)
        framerate = 44100
    
    output_buffer = io.BytesIO()
    with wave.open(output_buffer, 'wb') as wav_out:
        wav_out.setnchannels(2)
        wav_out.setsampwidth(2)
        wav_out.setframerate(44100)
        wav_out.writeframes(samples.tobytes())
    
    output_buffer.seek(0)
    wav_base64 = base64.b64encode(output_buffer.read()).decode('utf-8')
    
    duration_seconds = len(samples) / 2 / 44100
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
                'sampleRate': original_sample_rate,
                'duration': round(original_duration, 2)
            }
        })
    }