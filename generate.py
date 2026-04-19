import os
import sys
import time
import json
import base64
from datetime import datetime
from byteplussdkarkruntime import Ark


def log(event, **fields):
    payload = {"ts": datetime.now().isoformat(timespec="seconds"), "event": event, **fields}
    print(json.dumps(payload, ensure_ascii=False, default=str), file=sys.stderr, flush=True)


def dump(obj):
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "__dict__"):
        return {k: dump(v) for k, v in obj.__dict__.items() if not k.startswith("_")}
    if isinstance(obj, (list, tuple)):
        return [dump(x) for x in obj]
    if isinstance(obj, dict):
        return {k: dump(v) for k, v in obj.items()}
    return obj


BASE_URL = "https://ark.ap-southeast.bytepluses.com/api/v3"
MODEL = "dreamina-seedance-2-0-fast-260128"

log("startup", base_url=BASE_URL, model=MODEL, argc=len(sys.argv), has_api_key=bool(os.environ.get("ARK_API_KEY")))

if len(sys.argv) < 2:
    log("fatal", error="missing prompt argument")
    sys.exit(2)

prompt = sys.argv[1]
log("prompt", prompt=prompt)

content = [{"type": "text", "text": prompt}]
if len(sys.argv) >= 3 and sys.argv[2]:
    img_path = sys.argv[2]
    if os.path.exists(img_path):
        with open(img_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        content.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}})
        log("reference_image", path=img_path, b64_bytes=len(b64))
    else:
        log("reference_image_missing", path=img_path)

client = Ark(base_url=BASE_URL, api_key=os.environ["ARK_API_KEY"])
log("client_ready")

log("create_request")
t0 = time.time()
try:
    create_result = client.content_generation.tasks.create(
        model=MODEL,
        content=content,
        generate_audio=True,
        ratio="9:16",
        duration=15,
    )
except Exception as e:
    log("create_failed", error=repr(e))
    raise
task_id = create_result.id
log("created", task_id=task_id, elapsed_s=round(time.time() - t0, 2), full=dump(create_result))

poll_n = 0
poll_started = time.time()
while True:
    poll_n += 1
    try:
        get_result = client.content_generation.tasks.get(task_id=task_id)
    except Exception as e:
        log("poll_failed", attempt=poll_n, error=repr(e))
        time.sleep(3)
        continue
    status = get_result.status
    log("poll", attempt=poll_n, status=status, elapsed_s=round(time.time() - poll_started, 2))
    if status == "succeeded":
        log("succeeded", task_id=task_id, total_elapsed_s=round(time.time() - t0, 2), full=dump(get_result))
        if hasattr(get_result, "model_dump_json"):
            sys.stdout.write(get_result.model_dump_json())
        else:
            sys.stdout.write(json.dumps(dump(get_result), ensure_ascii=False))
        break
    elif status == "failed":
        log("failed", task_id=task_id, error=str(getattr(get_result, "error", None)), full=dump(get_result))
        sys.exit(1)
    else:
        time.sleep(3)
