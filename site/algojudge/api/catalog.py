"""Admin-managed lookup tables: languages, problem types, problem groups.

Anyone may read them (the problem editor and filters need them); only admins change them.
"""

from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from algojudge.api.deps import AdminUser, DbSession, OptionalUser
from algojudge.api.errors import ApiError
from algojudge.api.schemas import CatalogItem, CatalogItemCreate, CatalogItemUpdate, LanguageOut, LanguageUpdate
from algojudge.models import Language, ProblemGroup, ProblemType

router = APIRouter(tags=["catalog"])


@router.get("/languages", response_model=list[LanguageOut])
async def list_languages(
    db: DbSession, user: OptionalUser, include_disabled: Annotated[bool, Query()] = False
) -> list[Language]:
    stmt = select(Language).order_by(Language.sort_order, Language.key)
    if not (include_disabled and user is not None and user.role.is_admin):
        stmt = stmt.where(Language.is_enabled)
    return list(await db.scalars(stmt))


@router.patch("/languages/{key}", response_model=LanguageOut)
async def update_language(key: str, body: LanguageUpdate, db: DbSession, _admin: AdminUser) -> Language:
    lang = await db.get(Language, key)
    if lang is None:
        raise ApiError(404, "language_not_found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(lang, field, value)
    await db.commit()
    return lang


def _crud(model: type[ProblemType] | type[ProblemGroup], path: str, not_found: str) -> None:
    @router.get(f"/{path}", response_model=list[CatalogItem], name=f"list_{path}")
    async def list_items(db: DbSession) -> list:
        return list(await db.scalars(select(model).order_by(model.name)))

    @router.post(f"/{path}", response_model=CatalogItem, status_code=201, name=f"create_{path}")
    async def create_item(body: CatalogItemCreate, db: DbSession, _admin: AdminUser):
        item = model(slug=body.slug, name=body.name.strip())
        db.add(item)
        try:
            await db.commit()
        except IntegrityError as exc:
            await db.rollback()
            raise ApiError(409, "slug_taken", field="slug") from exc
        return item

    @router.patch(f"/{path}/{{item_id}}", response_model=CatalogItem, name=f"update_{path}")
    async def update_item(item_id: int, body: CatalogItemUpdate, db: DbSession, _admin: AdminUser):
        item = await db.get(model, item_id)
        if item is None:
            raise ApiError(404, not_found)
        for field, value in body.model_dump(exclude_none=True).items():
            setattr(item, field, value.strip() if isinstance(value, str) else value)
        try:
            await db.commit()
        except IntegrityError as exc:
            await db.rollback()
            raise ApiError(409, "slug_taken", field="slug") from exc
        return item

    @router.delete(f"/{path}/{{item_id}}", status_code=204, name=f"delete_{path}")
    async def delete_item(item_id: int, db: DbSession, _admin: AdminUser) -> None:
        item = await db.get(model, item_id)
        if item is None:
            raise ApiError(404, not_found)
        # Problems lose the type/group; the problems themselves are kept.
        await db.delete(item)
        await db.commit()


_crud(ProblemType, "problem-types", "problem_type_not_found")
_crud(ProblemGroup, "problem-groups", "problem_group_not_found")
