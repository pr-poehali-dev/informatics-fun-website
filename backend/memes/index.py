import json
import os
import base64
import uuid
import psycopg2
import boto3

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def ok(data, status=200):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(data, ensure_ascii=False)}

def err(msg, status=400):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps({'error': msg})}

def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

def upload_image(data_b64: str, ext: str) -> str:
    """Загружает base64-картинку в S3, возвращает CDN URL."""
    data = base64.b64decode(data_b64)
    key = f"memes/{uuid.uuid4().hex}.{ext}"
    content_type = "image/gif" if ext == "gif" else "image/jpeg"
    s3 = get_s3()
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=content_type)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return cdn_url

def handler(event: dict, context) -> dict:
    """API мемов: список, добавление с фото/гиф, лайки, комментарии."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    session_id = (event.get('headers') or {}).get('X-Session-Id', 'anon')

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET — список мемов или комментарии
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            meme_type = params.get('type')
            comments_for = params.get('comments_for')

            # Комментарии к мему
            if comments_for:
                cur.execute(
                    'SELECT id, author, text, created_at FROM comments WHERE meme_id=%s ORDER BY created_at ASC',
                    (int(comments_for),)
                )
                rows = cur.fetchall()
                comments = [{'id': r[0], 'author': r[1], 'text': r[2], 'created_at': str(r[3])} for r in rows]
                return ok({'comments': comments})

            # Список мемов
            if meme_type:
                cur.execute(
                    'SELECT id,title,text,emoji,tag,type,likes,dislikes,views,image_url FROM memes WHERE type=%s ORDER BY created_at DESC',
                    (meme_type,)
                )
            else:
                cur.execute(
                    'SELECT id,title,text,emoji,tag,type,likes,dislikes,views,image_url FROM memes ORDER BY created_at DESC'
                )
            rows = cur.fetchall()
            keys = ['id','title','text','emoji','tag','type','likes','dislikes','views','image_url']
            memes = [dict(zip(keys, r)) for r in rows]

            if memes:
                ids = [m['id'] for m in memes]
                cur.execute(
                    "SELECT meme_id, vote FROM votes WHERE session_id=%s AND meme_id=ANY(%s) AND vote != 'removed'",
                    (session_id, ids)
                )
                user_votes = {r[0]: r[1] for r in cur.fetchall()}
                # Кол-во комментариев
                cur.execute(
                    'SELECT meme_id, COUNT(*) FROM comments WHERE meme_id=ANY(%s) GROUP BY meme_id',
                    (ids,)
                )
                comment_counts = {r[0]: r[1] for r in cur.fetchall()}
                for m in memes:
                    m['user_vote'] = user_votes.get(m['id'])
                    m['comment_count'] = comment_counts.get(m['id'], 0)

            return ok({'memes': memes})

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = body.get('action', 'create')

            # Голосование
            if action == 'vote':
                meme_id = int(body.get('meme_id', 0))
                new_vote = body.get('vote')
                if not meme_id:
                    return err('meme_id обязателен')

                cur.execute('SELECT vote FROM votes WHERE meme_id=%s AND session_id=%s', (meme_id, session_id))
                row = cur.fetchone()
                old_vote = row[0] if row else None
                if old_vote == 'removed':
                    old_vote = None

                if old_vote == new_vote:
                    if old_vote == 'like':
                        cur.execute('UPDATE memes SET likes=GREATEST(likes-1,0) WHERE id=%s', (meme_id,))
                    else:
                        cur.execute('UPDATE memes SET dislikes=GREATEST(dislikes-1,0) WHERE id=%s', (meme_id,))
                    cur.execute("UPDATE votes SET vote='removed' WHERE meme_id=%s AND session_id=%s", (meme_id, session_id))
                    result_vote = None
                elif old_vote and old_vote != new_vote:
                    if old_vote == 'like':
                        cur.execute('UPDATE memes SET likes=GREATEST(likes-1,0), dislikes=dislikes+1 WHERE id=%s', (meme_id,))
                    else:
                        cur.execute('UPDATE memes SET dislikes=GREATEST(dislikes-1,0), likes=likes+1 WHERE id=%s', (meme_id,))
                    cur.execute('UPDATE votes SET vote=%s WHERE meme_id=%s AND session_id=%s', (new_vote, meme_id, session_id))
                    result_vote = new_vote
                else:
                    if new_vote == 'like':
                        cur.execute('UPDATE memes SET likes=likes+1 WHERE id=%s', (meme_id,))
                    else:
                        cur.execute('UPDATE memes SET dislikes=dislikes+1 WHERE id=%s', (meme_id,))
                    cur.execute(
                        'INSERT INTO votes (meme_id, session_id, vote) VALUES (%s,%s,%s) ON CONFLICT (meme_id,session_id) DO UPDATE SET vote=%s',
                        (meme_id, session_id, new_vote, new_vote)
                    )
                    result_vote = new_vote

                conn.commit()
                cur.execute('SELECT likes, dislikes FROM memes WHERE id=%s', (meme_id,))
                r = cur.fetchone()
                return ok({'likes': r[0], 'dislikes': r[1], 'user_vote': result_vote})

            # Добавить комментарий
            if action == 'comment':
                meme_id = int(body.get('meme_id', 0))
                text = (body.get('text') or '').strip()
                author = (body.get('author') or 'Аноним').strip()[:30]
                if not meme_id or not text:
                    return err('meme_id и text обязательны')
                if len(text) > 500:
                    return err('Комментарий слишком длинный')
                cur.execute(
                    'INSERT INTO comments (meme_id, session_id, author, text) VALUES (%s,%s,%s,%s) RETURNING id, created_at',
                    (meme_id, session_id, author, text)
                )
                row = cur.fetchone()
                conn.commit()
                return ok({'id': row[0], 'author': author, 'text': text, 'created_at': str(row[1])}, 201)

            # Загрузить фото/гиф (отдельный эндпоинт)
            if action == 'upload_image':
                data_b64 = body.get('data')
                ext = body.get('ext', 'jpg').lower()
                if ext not in ('jpg', 'jpeg', 'png', 'gif', 'webp'):
                    return err('Недопустимый формат файла')
                if not data_b64:
                    return err('data обязателен')
                if ext == 'jpeg':
                    ext = 'jpg'
                cdn_url = upload_image(data_b64, ext)
                return ok({'url': cdn_url})

            # Создать мем
            title = (body.get('title') or '').strip()
            text = (body.get('text') or '').strip() or None
            emoji = (body.get('emoji') or '😂').strip()
            tag = (body.get('tag') or 'общее').strip()
            meme_type = body.get('type', 'meme')
            image_url = body.get('image_url') or None

            if not title:
                return err('Заголовок обязателен')

            cur.execute(
                'INSERT INTO memes (title,text,emoji,tag,type,image_url) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id',
                (title, text, emoji, tag, meme_type, image_url)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': new_id, 'ok': True}, 201)

        return err('Not found', 404)

    finally:
        cur.close()
        conn.close()