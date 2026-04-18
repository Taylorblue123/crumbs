import os
import sys
import time
import json
from byteplussdkarkruntime import Ark

client = Ark(
    base_url="https://ark.ap-southeast.bytepluses.com/api/v3",
    api_key=os.environ["ARK_API_KEY"],
)

prompt = sys.argv[1]
MODEL = "dreamina-seedance-2-0-260128"

print(json.dumps({"event": "creating", "model": MODEL, "prompt": prompt}), file=sys.stderr, flush=True)
create_result = client.content_generation.tasks.create(
    model=MODEL,
    content=[{"type": "text", "text": prompt}],
)
task_id = create_result.id
print(json.dumps({"event": "created", "task_id": task_id}), file=sys.stderr, flush=True)

while True:
    get_result = client.content_generation.tasks.get(task_id=task_id)
    status = get_result.status
    if status == "succeeded":
        if hasattr(get_result, "model_dump_json"):
            sys.stdout.write(get_result.model_dump_json())
        else:
            sys.stdout.write(json.dumps(get_result, default=lambda o: getattr(o, "__dict__", str(o))))
        break
    elif status == "failed":
        print(json.dumps({"event": "failed", "error": str(getattr(get_result, "error", None))}), file=sys.stderr, flush=True)
        sys.exit(1)
    else:
        print(json.dumps({"event": "polling", "status": status}), file=sys.stderr, flush=True)
        time.sleep(3)
