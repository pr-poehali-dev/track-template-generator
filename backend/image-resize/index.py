import json
import base64
import io
from typing import Dict, Any
from PIL import Image

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Resize images to 1500x1500px for track covers
    Args: event - dict with httpMethod, body (base64 encoded image)
          context - object with request_id, function_name
    Returns: HTTP response with resized image in base64
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
            'body': ''
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
            'body': json.dumps({'error': 'No image data provided'})
        }
    
    image_bytes = base64.b64decode(body_data)
    image_buffer = io.BytesIO(image_bytes)
    
    img = Image.open(image_buffer)
    
    img = img.convert('RGB')
    
    img_resized = img.resize((1500, 1500), Image.Resampling.LANCZOS)
    
    output_buffer = io.BytesIO()
    img_resized.save(output_buffer, format='JPEG', quality=95)
    output_buffer.seek(0)
    
    jpeg_base64 = base64.b64encode(output_buffer.read()).decode('utf-8')
    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'image': jpeg_base64,
            'width': 1500,
            'height': 1500,
            'format': 'JPEG'
        })
    }
