"""Tiny web UI on top of the VNOI/DMOJ judge (runs INSIDE the judge-tiervnoj container).

GET  /            -> index.html
GET  /api/info    -> judge / runtime / problem information
POST /api/submit  -> grade a submission (blocking) and return every detail
"""
import json
import os
import platform
import re
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.argv = ['dmoj-web', '-c', '/web/judge.yml']

import yaml  # noqa: E402

from dmoj import contrib, executors, judgeenv  # noqa: E402
from dmoj.judge import Judge, Submission  # noqa: E402

judgeenv.load_env(cli=True)
executors.load_executors()
contrib.load_contrib_modules()

WEB_DIR = os.path.dirname(os.path.abspath(__file__))
PROBLEMS_DIR = '/problems'
ANSI = re.compile(r'\x1b\[[0-9;]*[A-Za-z]')


def _txt(v):
    v = v.decode('utf-8', 'replace') if isinstance(v, (bytes, bytearray)) else str(v)
    return ANSI.sub('', v).replace('\r\n', '\n')


class RecordingPacketManager:
    """Receives everything the judge would normally send to the site, and keeps it."""

    def __init__(self):
        self.reset()

    def reset(self):
        self.cases = []
        self.compile_error = None
        self.compile_message = ''
        self.internal_error = None
        self.aborted = False
        self.batch = None
        self.batch_counter = 0
        self.began = False
        self.ended = False

    def test_case_status_packet(self, position, result):
        self.cases.append(
            {
                'position': position,
                'batch': self.batch,
                'codes': result.readable_codes(),
                'time': result.execution_time,
                'wall_time': result.wall_clock_time,
                'memory_kb': result.max_memory,
                'context_switches': list(result.context_switches),
                'points': result.points,
                'total_points': result.total_points,
                'feedback': result.feedback,
                'extended_feedback': result.extended_feedback,
                'output': result.output,
                'runtime_version': result.runtime_version,
            }
        )

    def compile_error_packet(self, log):
        self.compile_error = _txt(log)

    def compile_message_packet(self, log):
        self.compile_message += _txt(log)

    def internal_error_packet(self, message):
        self.internal_error = _txt(message)

    def begin_grading_packet(self, is_pretested):
        self.began = True

    def grading_end_packet(self):
        self.ended = True

    def batch_begin_packet(self):
        self.batch_counter += 1
        self.batch = self.batch_counter

    def batch_end_packet(self):
        self.batch = None

    def submission_aborted_packet(self):
        self.aborted = True

    def supported_problems_packet(self, problems):
        pass

    def current_submission_packet(self):
        pass

    def submission_acknowledged_packet(self, sub_id):
        pass

    def run(self):
        pass

    def close(self):
        pass


pm = RecordingPacketManager()
judge = Judge(pm)
judge.listen()
grade_lock = threading.Lock()
counter = 0


def read_text(path, limit=20000):
    try:
        with open(path, 'rb') as f:
            data = f.read(limit + 1)
        text = data[:limit].decode('utf-8', 'replace')
        return text + ('\n... (truncated)' if len(data) > limit else '')
    except OSError:
        return None


def problem_info(pid):
    pdir = os.path.join(PROBLEMS_DIR, pid)
    init_text = read_text(os.path.join(pdir, 'init.yml'))
    cfg = yaml.safe_load(init_text) or {}
    cases = []
    for i, c in enumerate(cfg.get('test_cases', []), 1):
        cases.append(
            {
                'position': i,
                'in_file': c.get('in'),
                'out_file': c.get('out'),
                'points': c.get('points'),
                'input': read_text(os.path.join(pdir, c['in'])) if c.get('in') else None,
                'output': read_text(os.path.join(pdir, c['out'])) if c.get('out') else None,
            }
        )
    return {
        'id': pid,
        'statement': read_text(os.path.join(pdir, 'statement.md')) or '',
        'init_yml': init_text,
        'files': sorted(os.listdir(pdir)),
        'cases': cases,
        'total_points': sum(c['points'] or 0 for c in cases),
    }


def runtime_info():
    out = []
    for name, mod in sorted(executors.executors.items()):
        ex = mod.Executor
        try:
            versions = [f'{n} {".".join(map(str, v))}' for n, v in ex.get_runtime_versions()]
        except Exception:
            versions = []
        out.append({'id': name, 'ext': getattr(ex, 'ext', ''), 'versions': versions})
    return out


def info():
    problems = sorted(judgeenv.get_supported_problems())
    try:
        from importlib.metadata import version

        dmoj_version = version('dmoj')
    except Exception:
        dmoj_version = None
    return {
        'judge': {
            'source': 'github.com/VNOI-Admin/judge-server (branch master) - image vnoj/judge-tiervnoj',
            'dmoj_version': dmoj_version,
            'python': sys.version.split()[0],
            'kernel': platform.release(),
            'arch': platform.machine(),
            'in_docker': bool(os.environ.get('DMOJ_IN_DOCKER')),
            'config_file': '/web/judge.yml',
            'problem_storage_globs': list(judgeenv.storage_namespaces.get(None, [])),
            'submissions_graded_total': judge.submissions_graded,
            'case_verdicts_total': judge.case_verdicts,
        },
        'executors': runtime_info(),
        'problems': [problem_info(p) for p in problems],
    }


def grade(body):
    global counter
    pid = body['problem']
    lang = body['language']
    src = body['source']
    tl = float(body.get('time_limit', 2))
    ml = int(body.get('memory_limit', 65536))
    if pid not in set(judgeenv.get_supported_problems()):
        return {'error': f'unknown problem {pid!r}'}
    if lang not in executors.executors:
        return {'error': f'unknown language {lang!r}'}
    if not (0 < tl <= 20) or not (0 < ml <= 2 * 1024 * 1024):
        return {'error': 'time limit must be in (0, 20] s and memory limit in (0, 2097152] KB'}
    if len(src) > 200_000:
        return {'error': 'source too large'}

    with grade_lock:
        pm.reset()
        counter += 1
        sub_id = counter
        log = []
        started = time.time()
        judge.begin_grading(
            Submission(sub_id, pid, None, lang, src, tl, ml, False, {}),
            blocking=True,
            report=lambda line: log.append(ANSI.sub('', str(line))),
        )
        elapsed = time.time() - started
        cases = list(pm.cases)
        cases.sort(key=lambda c: c['position'])
        points = sum(c['points'] for c in cases)
        total = sum(c['total_points'] for c in cases)
        if pm.compile_error is not None:
            verdict = 'CE'
        elif pm.internal_error is not None:
            verdict = 'IE'
        else:
            verdict = 'AC'
            for code in ('IE', 'TLE', 'MLE', 'OLE', 'RTE', 'IR', 'WA'):
                if any(code in c['codes'] for c in cases):
                    verdict = code
                    break
        return {
            'submission_id': sub_id,
            'problem': pid,
            'language': lang,
            'time_limit': tl,
            'memory_limit_kb': ml,
            'source': src,
            'verdict': verdict,
            'points': points,
            'total_points': total,
            'grading_seconds': round(elapsed, 3),
            'compile_error': pm.compile_error,
            'compile_message': pm.compile_message,
            'internal_error': pm.internal_error,
            'cases': cases,
            'log': '\n'.join(log),
        }


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype='application/json; charset=utf-8'):
        data = body if isinstance(body, bytes) else body.encode()
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path in ('/', '/index.html'):
            with open(os.path.join(WEB_DIR, 'index.html'), 'rb') as f:
                self._send(200, f.read(), 'text/html; charset=utf-8')
        elif self.path == '/api/info':
            self._send(200, json.dumps(info()))
        else:
            self._send(404, '{"error":"not found"}')

    def do_POST(self):
        if self.path != '/api/submit':
            return self._send(404, '{"error":"not found"}')
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length))
            result = grade(body)
        except Exception as e:  # noqa: BLE001
            import traceback

            result = {'error': f'{type(e).__name__}: {e}', 'traceback': traceback.format_exc()}
        self._send(200, json.dumps(result))

    def log_message(self, fmt, *args):
        sys.stderr.write('[web] ' + fmt % args + '\n')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8765))
    print(f'Judge web UI listening on 0.0.0.0:{port}', flush=True)
    ThreadingHTTPServer(('0.0.0.0', port), Handler).serve_forever()
