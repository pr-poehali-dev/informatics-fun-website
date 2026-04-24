import json
import os
import psycopg2

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

def handler(event: dict, context) -> dict:
    """API для мемов: список, добавление, лайки/дизлайки."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    session_id = (event.get('headers') or {}).get('X-Session-Id', 'anon')

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET /memes?type=meme|joke
        if method == 'GET':
            meme_type = (event.get('queryStringParameters') or {}).get('type')
            if meme_type:
                cur.execute(
                    "SELECT id,title,text,emoji,tag,type,likes,dislikes,views FROM memes WHERE type=%s ORDER BY created_at DESC",
                    (meme_type,)
                )
            else:
                cur.execute(
                    "SELECT id,title,text,emoji,tag,type,likes,dislikes,views FROM memes ORDER BY created_at DESC"
                )
            rows = cur.fetchall()
            keys = ['id','title','text','emoji','tag','type','likes','dislikes','views']
            memes = [dict(zip(keys, r)) for r in rows]

            if memes:
                ids = [m['id'] for m in memes]
                cur.execute(
                    "SELECT meme_id, vote FROM votes WHERE session_id=%s AND meme_id=ANY(%s) AND vote != 'removed'",
                    (session_id, ids)
                )
                user_votes = {r[0]: r[1] for r in cur.fetchall()}
                for m in memes:
                    m['user_vote'] = user_votes.get(m['id'])

            return ok({'memes': memes})

        # POST /memes/vote
        if method == 'POST' and 'vote' in path:
            body = json.loads(event.get('body') or '{}')
            meme_id = int(body.get('meme_id', 0))
            new_vote = body.get('vote')

            if not meme_id:
                return err('meme_id обязателен')

            cur.execute(
                "SELECT vote FROM votes WHERE meme_id=%s AND session_id=%s",
                (meme_id, session_id)
            )
            row = cur.fetchone()
            old_vote = row[0] if row else None
            if old_vote == 'removed':
                old_vote = None

            if old_vote == new_vote:
                if old_vote == 'like':
                    cur.execute("UPDATE memes SET likes=GREATEST(likes-1,0) WHERE id=%s", (meme_id,))
                else:
                    cur.execute("UPDATE memes SET dislikes=GREATEST(dislikes-1,0) WHERE id=%s", (meme_id,))
                cur.execute("UPDATE votes SET vote='removed' WHERE meme_id=%s AND session_id=%s", (meme_id, session_id))
                result_vote = None
            elif old_vote and old_vote != new_vote:
                if old_vote == 'like':
                    cur.execute("UPDATE memes SET likes=GREATEST(likes-1,0), dislikes=dislikes+1 WHERE id=%s", (meme_id,))
                else:
                    cur.execute("UPDATE memes SET dislikes=GREATEST(dislikes-1,0), likes=likes+1 WHERE id=%s", (meme_id,))
                cur.execute("UPDATE votes SET vote=%s WHERE meme_id=%s AND session_id=%s", (new_vote, meme_id, session_id))
                result_vote = new_vote
            else:
                if new_vote == 'like':
                    cur.execute("UPDATE memes SET likes=likes+1 WHERE id=%s", (meme_id,))
                else:
                    cur.execute("UPDATE memes SET dislikes=dislikes+1 WHERE id=%s", (meme_id,))
                cur.execute(
                    "INSERT INTO votes (meme_id, session_id, vote) VALUES (%s,%s,%s) ON CONFLICT (meme_id,session_id) DO UPDATE SET vote=%s",
                    (meme_id, session_id, new_vote, new_vote)
                )
                result_vote = new_vote

            conn.commit()
            cur.execute("SELECT likes, dislikes FROM memes WHERE id=%s", (meme_id,))
            r = cur.fetchone()
            return ok({'likes': r[0], 'dislikes': r[1], 'user_vote': result_vote})

        # POST /memes — новый мем
        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            title = (body.get('title') or '').strip()
            text = (body.get('text') or '').strip() or None
            emoji = (body.get('emoji') or '😂').strip()
            tag = (body.get('tag') or 'общее').strip()
            meme_type = body.get('type', 'meme')

            if not title:
                return err('Заголовок обязателен')

            cur.execute(
                "INSERT INTO memes (title,text,emoji,tag,type) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                (title, text, emoji, tag, meme_type)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': new_id, 'ok': True}, 201)

        return err('Not found', 404)

    finally:
        cur.close()
        conn.close()
