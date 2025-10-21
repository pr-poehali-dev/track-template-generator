import json
import base64
import io
import gzip
from typing import Dict, Any
from PIL import Image, ImageOps

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Resize images to 1500x1500px for track covers with smart cropping
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
                'Access-Control-Allow-Headers': 'Content-Type, Content-Encoding',
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
    headers = event.get('headers', {})
    is_compressed = headers.get('content-encoding', '').lower() == 'gzip'
    
    if not body_data:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'No image data provided'})
        }
    
    try:
        decoded_data = base64.b64decode(body_data)
        if is_compressed:
            image_bytes = gzip.decompress(decoded_data)
        else:
            image_bytes = decoded_data
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Decompression error: {str(e)}'})
        }
    
    image_buffer = io.BytesIO(image_bytes)
    
    try:
        img = Image.open(image_buffer)
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Invalid image file: {str(e)}'})
        }
    
    original_width, original_height = img.size
    original_format = img.format or 'UNKNOWN'
    
    img = ImageOps.exif_transpose(img)
    
    img = img.convert('RGB')
    
    img_ratio = img.width / img.height
    target_ratio = 1.0
    
    if img_ratio > target_ratio:
        new_width = int(img.height * target_ratio)
        offset = (img.width - new_width) // 2
        img = img.crop((offset, 0, offset + new_width, img.height))
    elif img_ratio < target_ratio:
        new_height = int(img.width / target_ratio)
        offset = (img.height - new_height) // 2
        img = img.crop((0, offset, img.width, offset + new_height))
    
    img_resized = img.resize((1500, 1500), Image.Resampling.LANCZOS)
    
    output_buffer = io.BytesIO()
    img_resized.save(
        output_buffer,
        format='JPEG',
        quality=95,
        optimize=True,
        progressive=True
    )
    output_buffer.seek(0)
    
    jpeg_base64 = base64.b64encode(output_buffer.read()).decode('utf-8')
    file_size_kb = len(output_buffer.getvalue()) / 1024
    
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
            'format': 'JPEG',
            'quality': 95,
            'fileSizeKB': round(file_size_kb, 2),
            'original': {
                'width': original_width,
                'height': original_height,
                'format': original_format
            }
        })
    }