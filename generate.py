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


def emit(event, **fields):
    """Write a JSON line to stdout for the Node.js parent to read as SSE."""
    payload = {"event": event, **fields}
    sys.stdout.write(json.dumps(payload, ensure_ascii=False, default=str) + "\n")
    sys.stdout.flush()


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
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/png;base64,{b64}"},
            "role": "reference_image",
        })
        log("reference_image", path=img_path, b64_bytes=len(b64))
    else:
        log("reference_image_missing", path=img_path)

client = Ark(base_url=BASE_URL, api_key=os.environ["ARK_API_KEY"])
log("client_ready")

def run_generation(use_audio):
    label = "with audio" if use_audio else "without audio"
    log("create_request", audio=use_audio)
    emit("progress", status="creating", attempt=0, elapsed_s=0)
    t0 = time.time()
    try:
        create_result = client.content_generation.tasks.create(
            model=MODEL,
            content=content,
            generate_audio=use_audio,
            ratio="9:16",
            resolution="720p",
            duration=15,
            watermark=False,
        )
    except Exception as e:
        log("create_failed", error=repr(e))
        return "create_error", repr(e)
    task_id = create_result.id
    log("created", task_id=task_id, elapsed_s=round(time.time() - t0, 2), audio=use_audio, full=dump(create_result))

    poll_n = 0
    while True:
        poll_n += 1
        elapsed = round(time.time() - t0, 1)
        try:
            get_result = client.content_generation.tasks.get(task_id=task_id)
        except Exception as e:
            log("poll_failed", attempt=poll_n, error=repr(e))
            emit("progress", status="polling", attempt=poll_n, elapsed_s=elapsed)
            time.sleep(3)
            continue
        status = get_result.status
        log("poll", attempt=poll_n, status=status, elapsed_s=elapsed)
        emit("progress", status=status, attempt=poll_n, elapsed_s=elapsed)
        if status == "succeeded":
            log("succeeded", task_id=task_id, total_elapsed_s=round(time.time() - t0, 2), full=dump(get_result))
            result_data = dump(get_result)
            video_url = None
            if isinstance(result_data, dict):
                video_url = result_data.get("content", {}).get("video_url")
            return "done", video_url
        elif status == "failed":
            err = getattr(get_result, "error", None)
            err_data = dump(err) if err else {}
            err_code = err_data.get("code", "") if isinstance(err_data, dict) else ""
            err_msg = err_data.get("message", str(err)) if isinstance(err_data, dict) else str(err)
            log("failed", task_id=task_id, error=err_msg, code=err_code, full=dump(get_result))
            return "failed", (err_code, err_msg)
        else:
            time.sleep(3)


# First attempt: with audio
outcome, data = run_generation(use_audio=True)

# If audio was flagged as sensitive, retry without audio
if outcome == "failed":
    err_code, err_msg = data
    if "AudioSensitive" in err_code or "audio" in err_code.lower():
        log("retry_without_audio", reason=err_code)
        emit("progress", status="retrying_without_audio", attempt=0, elapsed_s=0)
        outcome, data = run_generation(use_audio=False)

if outcome == "done":
    emit("done", video_url=data)
elif outcome == "failed":
    _, err_msg = data
    emit("error", message=err_msg)
elif outcome == "create_error":
    emit("error", message=data)
