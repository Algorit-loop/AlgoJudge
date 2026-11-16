"""Error responses carry a machine-readable code (and optionally the offending field).

The UI translates the code with i18n (errors.<code>), so the API never returns user-facing text.
Shape: {"detail": {"code": "username_taken", "field": "username"}}
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class ApiError(HTTPException):
    def __init__(self, status_code: int, code: str, field: str | None = None):
        detail: dict[str, str] = {"code": code}
        if field is not None:
            detail["field"] = field
        super().__init__(status_code=status_code, detail=detail)


async def _validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    # Report the first invalid field of the body/query, e.g. ["body", "username"] -> "username".
    errors = exc.errors()
    field = None
    if errors:
        loc = [str(part) for part in errors[0].get("loc", ()) if part not in ("body", "query", "path")]
        field = ".".join(loc) or None
    detail: dict[str, str] = {"code": "invalid_input"}
    if field:
        detail["field"] = field
    return JSONResponse(status_code=422, content={"detail": detail})


def install_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, _validation_error_handler)
