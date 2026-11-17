"""Problems: list, view, create, edit, staff, editorial, statement images.

Roles on a problem (problem_members):
- creator: edits the problem and is credited as its author;
- curator: edits the problem, not credited;
- tester:  sees the private problem (to test it), cannot edit.
Creators and curators must be setters or above; a tester can be any user.

Who may do what:
- view:    public problems -> everyone; private -> its members and admins (others get 404).
- create:  setters and above; the creator becomes the first "creator" member; new problems start private.
- edit:    creators/curators (setter+) and admins: statement, limits, scoring, metadata, staff, editorial, images.
- publish (visibility) and delete: admins only.
"""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, UploadFile
from sqlalchemy import exists, func, nulls_last, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from algojudge.api.deps import AdminUser, AppSettings, DbSession, OptionalUser, require_role
from algojudge.api.errors import ApiError
from algojudge.api.schemas import (
    ImageUploaded,
    ProblemCreate,
    ProblemDetail,
    ProblemList,
    ProblemMembersUpdate,
    ProblemSettings,
    ProblemSummary,
    ProblemUpdate,
    PublicUser,
    SolutionOut,
    SolutionUpdate,
)
from algojudge.media import detect_image_type, save_problem_image
from algojudge.models import (
    Language,
    MemberRole,
    Problem,
    ProblemGroup,
    ProblemMember,
    ProblemSolution,
    ProblemType,
    Role,
    User,
    Visibility,
)

router = APIRouter(prefix="/problems", tags=["problems"])

SetterUser = Annotated[User, Depends(require_role(Role.SETTER))]
EDITOR_ROLES = (MemberRole.CREATOR, MemberRole.CURATOR)


# --- permissions ---


def can_view(problem: Problem, user: User | None) -> bool:
    if problem.visibility == Visibility.PUBLIC:
        return True
    return user is not None and (user.role.is_admin or problem.role_of(user.id) is not None)


def can_edit(problem: Problem, user: User | None) -> bool:
    if user is None:
        return False
    if user.role.is_admin:
        return True
    return user.role.rank >= Role.SETTER.rank and problem.role_of(user.id) in EDITOR_ROLES


def solution_visible(solution: ProblemSolution | None, problem: Problem, user: User | None) -> bool:
    if solution is None:
        return False
    if can_edit(problem, user):
        return True
    published = solution.is_public and (solution.publish_at is None or solution.publish_at <= datetime.now(UTC))
    return published and can_view(problem, user)


# --- serialisation ---


def _public(users: list[User]) -> list[PublicUser]:
    return [PublicUser.model_validate(u) for u in users]


def _detail(problem: Problem, user: User | None) -> ProblemDetail:
    return ProblemDetail.model_validate(
        {
            **ProblemSummary.model_validate(problem).model_dump(),
            "statement_md": problem.statement_md,
            "updated_at": problem.updated_at,
            "allowed_languages": problem.allowed_languages,
            "creators": _public(problem.users_with(MemberRole.CREATOR)),
            "has_solution": solution_visible(problem.solution, problem, user),
            "can_edit": can_edit(problem, user),
            "can_change_visibility": user is not None and user.role.is_admin,
            "can_delete": user is not None and user.role.is_admin,
        }
    )


def _settings(problem: Problem, user: User | None) -> ProblemSettings:
    return ProblemSettings.model_validate(
        {
            **_detail(problem, user).model_dump(),
            "curators": _public(problem.users_with(MemberRole.CURATOR)),
            "testers": _public(problem.users_with(MemberRole.TESTER)),
            "source_visibility": problem.source_visibility,
            "testcase_visibility": problem.testcase_visibility,
            "testcase_result_visibility": problem.testcase_result_visibility,
        }
    )


# --- loading ---


async def _get_problem(db: AsyncSession, code: str) -> Problem | None:
    return await db.scalar(select(Problem).where(Problem.code == code.lower()))


async def _get_viewable(db: AsyncSession, code: str, user: User | None) -> Problem:
    problem = await _get_problem(db, code)
    if problem is None or not can_view(problem, user):
        raise ApiError(404, "problem_not_found")
    return problem


async def _get_editable(db: AsyncSession, code: str, user: User | None) -> Problem:
    problem = await _get_viewable(db, code, user)
    if not can_edit(problem, user):
        raise ApiError(403, "forbidden")
    return problem


async def _reload(db: AsyncSession, problem: Problem) -> Problem:
    """Commit, then load the problem again with fresh relationships (members, types, languages...)."""
    await db.commit()
    stmt = select(Problem).where(Problem.code == problem.code).execution_options(populate_existing=True)
    reloaded = await db.scalar(stmt)
    assert reloaded is not None
    return reloaded


# --- routes ---


@router.get("", response_model=ProblemList)
async def list_problems(
    db: DbSession,
    user: OptionalUser,
    q: Annotated[str | None, Query(max_length=100)] = None,
    mine: bool = False,
    group: Annotated[str | None, Query(max_length=32)] = None,
    type: Annotated[str | None, Query(max_length=32)] = None,
    sort: Annotated[str, Query(pattern="^(code|newest|points)$")] = "code",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 50,
) -> ProblemList:
    """Problems the viewer may see. `mine=true`: problems where the viewer is a member (any role)."""
    is_member = exists().where(
        ProblemMember.problem_id == Problem.id, ProblemMember.user_id == (user.id if user else -1)
    )
    stmt = select(Problem)
    if mine:
        stmt = stmt.where(is_member)
    elif user is None:
        stmt = stmt.where(Problem.visibility == Visibility.PUBLIC)
    elif not user.role.is_admin:
        stmt = stmt.where(or_(Problem.visibility == Visibility.PUBLIC, is_member))
    if q:
        pattern = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(Problem.code.like(pattern), func.lower(Problem.title).like(pattern)))
    if group:
        stmt = stmt.where(Problem.group.has(ProblemGroup.slug == group))
    if type:
        stmt = stmt.where(Problem.types.any(ProblemType.slug == type))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    order = {
        "code": (Problem.code,),
        "newest": (nulls_last(Problem.published_at.desc()), Problem.created_at.desc(), Problem.id.desc()),
        "points": (Problem.points, Problem.code),
    }[sort]
    rows = await db.scalars(stmt.order_by(*order).offset((page - 1) * page_size).limit(page_size))
    return ProblemList(items=[ProblemSummary.model_validate(p) for p in rows], total=total)


@router.post("", response_model=ProblemSettings, status_code=201)
async def create_problem(body: ProblemCreate, db: DbSession, user: SetterUser) -> ProblemSettings:
    if await _get_problem(db, body.code) is not None:
        raise ApiError(409, "problem_code_taken", field="code")
    problem = Problem(**body.model_dump(), created_by_id=user.id, visibility=Visibility.PRIVATE)
    problem.members = [ProblemMember(user_id=user.id, role=MemberRole.CREATOR)]
    # New problems accept every enabled language; editors narrow it down later.
    problem.allowed_languages = list(await db.scalars(select(Language).where(Language.is_enabled)))
    db.add(problem)
    return _settings(await _reload(db, problem), user)


@router.get("/{code}", response_model=ProblemDetail)
async def get_problem(code: str, db: DbSession, user: OptionalUser) -> ProblemDetail:
    return _detail(await _get_viewable(db, code, user), user)


@router.get("/{code}/settings", response_model=ProblemSettings)
async def get_problem_settings(code: str, db: DbSession, user: OptionalUser) -> ProblemSettings:
    """Everything the editor needs. Editors only."""
    return _settings(await _get_editable(db, code, user), user)


@router.patch("/{code}", response_model=ProblemSettings)
async def update_problem(code: str, body: ProblemUpdate, db: DbSession, user: OptionalUser) -> ProblemSettings:
    problem = await _get_editable(db, code, user)
    assert user is not None
    changes = body.model_dump(exclude_unset=True)

    visibility = changes.pop("visibility", None)
    if visibility is not None and visibility != problem.visibility:
        if not user.role.is_admin:
            raise ApiError(403, "visibility_admin_only", field="visibility")
        problem.visibility = visibility

    if "group_id" in changes:
        group_id = changes.pop("group_id")
        if group_id is not None and await db.get(ProblemGroup, group_id) is None:
            raise ApiError(400, "problem_group_not_found", field="group_id")
        problem.group_id = group_id

    type_ids = changes.pop("type_ids", None)
    if type_ids is not None:
        types = list(await db.scalars(select(ProblemType).where(ProblemType.id.in_(set(type_ids)))))
        if len(types) != len(set(type_ids)):
            raise ApiError(400, "problem_type_not_found", field="type_ids")
        problem.types = types

    language_keys = changes.pop("language_keys", None)
    if language_keys is not None:
        if not language_keys:
            raise ApiError(400, "languages_required", field="language_keys")
        langs = list(await db.scalars(select(Language).where(Language.key.in_(set(language_keys)))))
        if len(langs) != len(set(language_keys)):
            raise ApiError(400, "language_not_found", field="language_keys")
        problem.allowed_languages = langs

    for field, value in changes.items():
        if value is None and field != "published_at":
            continue  # explicit null on a non-nullable field: ignore
        setattr(problem, field, value)
    # A public problem always has a publishing date: fill it in when none was given.
    if problem.visibility == Visibility.PUBLIC and problem.published_at is None:
        problem.published_at = datetime.now(UTC)
    return _settings(await _reload(db, problem), user)


@router.delete("/{code}", status_code=204)
async def delete_problem(code: str, db: DbSession, _admin: AdminUser) -> None:
    problem = await _get_problem(db, code)
    if problem is None:
        raise ApiError(404, "problem_not_found")
    await db.delete(problem)
    await db.commit()


@router.put("/{code}/members", response_model=ProblemSettings)
async def set_members(code: str, body: ProblemMembersUpdate, db: DbSession, user: OptionalUser) -> ProblemSettings:
    """Replace the creator, curator and tester lists."""
    problem = await _get_editable(db, code, user)
    assert user is not None

    wanted: dict[str, MemberRole] = {}
    for role, names in (
        (MemberRole.CREATOR, body.creators),
        (MemberRole.CURATOR, body.curators),
        (MemberRole.TESTER, body.testers),
    ):
        for name in names:
            key = name.strip().lower()
            if not key:
                continue
            if key in wanted and wanted[key] != role:
                raise ApiError(400, "member_in_two_roles", field=name.strip())
            wanted[key] = role
    if MemberRole.CREATOR not in wanted.values():
        raise ApiError(400, "creators_required", field="creators")

    found = {u.username.lower(): u for u in await db.scalars(select(User).where(func.lower(User.username).in_(wanted)))}
    missing = sorted(set(wanted) - set(found))
    if missing:
        raise ApiError(400, "user_not_found", field=missing[0])
    for key, role in wanted.items():
        member = found[key]
        if not member.is_active:
            raise ApiError(400, "user_not_found", field=member.username)
        if role in EDITOR_ROLES and member.role.rank < Role.SETTER.rank:
            raise ApiError(400, "editor_must_be_setter", field=member.username)
    # A non-admin editor may not remove their own edit access (they would lock themselves out).
    if not user.role.is_admin and wanted.get(user.username.lower()) not in EDITOR_ROLES:
        raise ApiError(400, "cannot_remove_self", field=user.username)

    problem.members = [ProblemMember(user_id=found[k].id, role=r) for k, r in wanted.items()]
    return _settings(await _reload(db, problem), user)


@router.get("/{code}/solution", response_model=SolutionOut)
async def get_solution(code: str, db: DbSession, user: OptionalUser) -> SolutionOut:
    problem = await _get_viewable(db, code, user)
    solution = problem.solution
    if solution is None or not solution_visible(solution, problem, user):
        raise ApiError(404, "solution_not_found")
    out = SolutionOut.model_validate(solution)
    out.is_visible = solution.is_public and (solution.publish_at is None or solution.publish_at <= datetime.now(UTC))
    return out


@router.put("/{code}/solution", response_model=SolutionOut)
async def put_solution(code: str, body: SolutionUpdate, db: DbSession, user: OptionalUser) -> SolutionOut:
    problem = await _get_editable(db, code, user)
    if problem.solution is None:
        problem.solution = ProblemSolution()
    problem.solution.content_md = body.content_md
    problem.solution.is_public = body.is_public
    problem.solution.publish_at = body.publish_at
    problem = await _reload(db, problem)
    return await get_solution(problem.code, db, user)


@router.delete("/{code}/solution", status_code=204)
async def delete_solution(code: str, db: DbSession, user: OptionalUser) -> None:
    problem = await _get_editable(db, code, user)
    if problem.solution is not None:
        problem.solution = None
        await db.commit()


@router.post("/{code}/images", response_model=ImageUploaded, status_code=201)
async def upload_image(
    code: str, file: UploadFile, db: DbSession, user: OptionalUser, settings: AppSettings
) -> ImageUploaded:
    """Upload an image for the statement or editorial; returns the URL to put in the Markdown."""
    problem = await _get_editable(db, code, user)
    data = await file.read(settings.max_image_bytes + 1)
    if len(data) > settings.max_image_bytes:
        raise ApiError(413, "image_too_large")
    ext = detect_image_type(data)
    if ext is None:
        raise ApiError(415, "image_type_not_allowed")
    rel = save_problem_image(settings.media_dir, problem.code, data, ext)
    return ImageUploaded(url=settings.media_url + rel)
