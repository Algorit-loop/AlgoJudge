"""Problems: list, view, create, edit, authors, statement images.

Who may do what:
- view:   public problems -> everyone; private problems -> their authors and admins (others get 404,
          so the existence of a private problem is not revealed).
- create: setters and above. The creator becomes the first author. New problems start private.
- edit:   authors who are setters or above, and admins (title, statement, limits, authors, images).
- publish (change visibility) and delete: admins only.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, UploadFile
from sqlalchemy import exists, func, or_, select

from algojudge.api.deps import AdminUser, AppSettings, DbSession, OptionalUser, require_role
from algojudge.api.errors import ApiError
from algojudge.api.schemas import (
    ImageUploaded,
    ProblemAuthorsUpdate,
    ProblemCreate,
    ProblemDetail,
    ProblemList,
    ProblemSummary,
    ProblemUpdate,
    PublicUser,
)
from algojudge.media import detect_image_type, save_problem_image
from algojudge.models import Problem, ProblemAuthor, Role, User, Visibility

router = APIRouter(prefix="/problems", tags=["problems"])

SetterUser = Annotated[User, Depends(require_role(Role.SETTER))]


def _is_author(problem: Problem, user: User) -> bool:
    return any(a.id == user.id for a in problem.authors)


def can_view(problem: Problem, user: User | None) -> bool:
    if problem.visibility == Visibility.PUBLIC:
        return True
    return user is not None and (user.role.is_admin or _is_author(problem, user))


def can_edit(problem: Problem, user: User | None) -> bool:
    if user is None:
        return False
    return user.role.is_admin or (user.role.rank >= Role.SETTER.rank and _is_author(problem, user))


def _detail(problem: Problem, user: User | None) -> ProblemDetail:
    detail = ProblemDetail.model_validate(problem)
    detail.authors = [PublicUser.model_validate(a) for a in problem.authors]
    detail.can_edit = can_edit(problem, user)
    detail.can_change_visibility = user is not None and user.role.is_admin
    return detail


async def _get_problem(db: DbSession, code: str) -> Problem | None:
    return await db.scalar(select(Problem).where(Problem.code == code.lower()))


async def _get_viewable(db: DbSession, code: str, user: User | None) -> Problem:
    problem = await _get_problem(db, code)
    if problem is None or not can_view(problem, user):
        raise ApiError(404, "problem_not_found")
    return problem


async def _get_editable(db: DbSession, code: str, user: User | None) -> Problem:
    problem = await _get_viewable(db, code, user)
    if not can_edit(problem, user):
        raise ApiError(403, "forbidden")
    return problem


@router.get("", response_model=ProblemList)
async def list_problems(
    db: DbSession,
    user: OptionalUser,
    q: Annotated[str | None, Query(max_length=100)] = None,
    mine: bool = False,
    sort: Annotated[str, Query(pattern="^(code|newest)$")] = "code",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 50,
) -> ProblemList:
    """Problems the viewer may see. `mine=true` limits it to problems the viewer is an author of."""
    is_author = exists().where(
        ProblemAuthor.problem_id == Problem.id, ProblemAuthor.user_id == (user.id if user else -1)
    )
    stmt = select(Problem)
    if mine:
        stmt = stmt.where(is_author)
    elif user is None:
        stmt = stmt.where(Problem.visibility == Visibility.PUBLIC)
    elif not user.role.is_admin:
        stmt = stmt.where(or_(Problem.visibility == Visibility.PUBLIC, is_author))
    if q:
        pattern = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(Problem.code.like(pattern), func.lower(Problem.title).like(pattern)))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    order = (Problem.code,) if sort == "code" else (Problem.created_at.desc(), Problem.id.desc())
    rows = await db.scalars(stmt.order_by(*order).offset((page - 1) * page_size).limit(page_size))
    return ProblemList(items=[ProblemSummary.model_validate(p) for p in rows], total=total)


@router.post("", response_model=ProblemDetail, status_code=201)
async def create_problem(body: ProblemCreate, db: DbSession, user: SetterUser) -> ProblemDetail:
    if await _get_problem(db, body.code) is not None:
        raise ApiError(409, "problem_code_taken", field="code")
    problem = Problem(**body.model_dump(), created_by_id=user.id, visibility=Visibility.PRIVATE)
    problem.authors = [user]
    db.add(problem)
    await db.commit()
    await db.refresh(problem)
    return _detail(problem, user)


@router.get("/{code}", response_model=ProblemDetail)
async def get_problem(code: str, db: DbSession, user: OptionalUser) -> ProblemDetail:
    return _detail(await _get_viewable(db, code, user), user)


@router.patch("/{code}", response_model=ProblemDetail)
async def update_problem(code: str, body: ProblemUpdate, db: DbSession, user: OptionalUser) -> ProblemDetail:
    problem = await _get_editable(db, code, user)
    changes = body.model_dump(exclude_unset=True, exclude_none=True)
    if "visibility" in changes and changes["visibility"] != problem.visibility and not (user and user.role.is_admin):
        raise ApiError(403, "visibility_admin_only", field="visibility")
    for field, value in changes.items():
        setattr(problem, field, value)
    await db.commit()
    await db.refresh(problem)
    return _detail(problem, user)


@router.delete("/{code}", status_code=204)
async def delete_problem(code: str, db: DbSession, _admin: AdminUser) -> None:
    problem = await _get_problem(db, code)
    if problem is None:
        raise ApiError(404, "problem_not_found")
    await db.delete(problem)
    await db.commit()


@router.put("/{code}/authors", response_model=ProblemDetail)
async def set_authors(code: str, body: ProblemAuthorsUpdate, db: DbSession, user: OptionalUser) -> ProblemDetail:
    """Replace the author list. Authors must be setters or above; at least one author is kept."""
    problem = await _get_editable(db, code, user)
    wanted = {u.strip().lower() for u in body.usernames if u.strip()}
    if not wanted:
        raise ApiError(400, "authors_required", field="usernames")
    found = list(await db.scalars(select(User).where(func.lower(User.username).in_(wanted))))
    missing = wanted - {u.username.lower() for u in found}
    if missing:
        raise ApiError(400, "user_not_found", field=sorted(missing)[0])
    not_setter = [u for u in found if u.role.rank < Role.SETTER.rank or not u.is_active]
    if not_setter:
        raise ApiError(400, "author_must_be_setter", field=not_setter[0].username)
    problem.authors = found
    await db.commit()
    await db.refresh(problem)
    return _detail(problem, user)


@router.post("/{code}/images", response_model=ImageUploaded, status_code=201)
async def upload_image(
    code: str, file: UploadFile, db: DbSession, user: OptionalUser, settings: AppSettings
) -> ImageUploaded:
    """Upload an image for the statement; returns the URL to put in the Markdown."""
    problem = await _get_editable(db, code, user)
    data = await file.read(settings.max_image_bytes + 1)
    if len(data) > settings.max_image_bytes:
        raise ApiError(413, "image_too_large")
    ext = detect_image_type(data)
    if ext is None:
        raise ApiError(415, "image_type_not_allowed")
    rel = save_problem_image(settings.media_dir, problem.code, data, ext)
    return ImageUploaded(url=settings.media_url + rel)
