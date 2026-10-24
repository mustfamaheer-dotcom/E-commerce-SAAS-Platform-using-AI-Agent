# backend/services/tenant_service.py
"""Tenant and Store Configuration service."""
import re
import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from backend.models.tenant import Tenant, StoreSettings, ThemeConfig
from backend.models.user import User
from backend.schemas.tenant import TenantCreateDTO, TenantUpdateDTO
from backend.core.errors import EntityNotFoundException, PlatformException


class TenantService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, tenant_id: str) -> Tenant:
        tenant = self.db.query(Tenant).filter_by(id=tenant_id).first()
        if not tenant:
            raise EntityNotFoundException("Store / Tenant", tenant_id)
        return tenant

    def get_by_slug(self, slug: str) -> Tenant:
        tenant = self.db.query(Tenant).filter_by(slug=slug).first()
        if not tenant:
            raise EntityNotFoundException("Store with slug", slug)
        return tenant

    def list_all(self, limit: int = 50) -> List[Tenant]:
        return self.db.query(Tenant).order_by(Tenant.created_at.desc()).limit(limit).all()

    def provision_store(self, dto: TenantCreateDTO) -> Dict[str, Any]:
        """Provisions a new isolated tenant store with settings, theme, and initial owner user."""
        raw_slug = re.sub(r'[^a-zA-Z0-9]+', '-', dto.name.lower()).strip('-') or "store"
        unique_suffix = uuid.uuid4().hex[:6]
        slug = f"{raw_slug}-{unique_suffix}"
        tenant_id = f"tenant_{uuid.uuid4().hex[:10]}"

        tenant = Tenant(
            id=tenant_id,
            slug=slug,
            name=dto.name.strip(),
            currency=dto.currency,
            theme_config={"mode": dto.theme_mode},
        )
        self.db.add(tenant)
        self.db.flush()

        settings = StoreSettings(
            tenant_id=tenant_id,
            display_name=dto.name.strip(),
            currency=dto.currency,
            business_sector=dto.category or "electronics",
            contact_email=dto.owner_email.strip().lower(),
            contact_phone=dto.phone or "",
        )
        theme = ThemeConfig(
            tenant_id=tenant_id,
            mode=dto.theme_mode,
            primary_color="#0ea5e9" if dto.theme_mode == "dark" else "#4F46E5",
            secondary_color="#6366f1",
            accent_color="#10b981",
        )
        self.db.add_all([settings, theme])

        # Create or link owner
        email_clean = dto.owner_email.strip().lower()
        user = self.db.query(User).filter_by(email=email_clean).first()
        if not user:
            from backend.core.security import hash_password
            user = User(
                id=f"usr_{uuid.uuid4().hex[:10]}",
                tenant_id=tenant_id,
                email=email_clean,
                full_name=dto.owner_name or dto.name,
                phone=dto.phone or "",
                role="owner",
                password_hash=hash_password(dto.password) if dto.password else None,
            )
            self.db.add(user)
        else:
            user.tenant_id = tenant_id

        self.db.commit()
        self.db.refresh(tenant)

        return {
            "tenant_id": tenant.id,
            "name": tenant.name,
            "slug": tenant.slug,
            "currency": tenant.currency,
            "owner_email": email_clean,
            "admin_url": f"/admin/{tenant.slug}",
            "storefront_url": f"/store/{tenant.slug}",
        }

    def update_settings(self, tenant_id: str, updates: Dict[str, Any]) -> StoreSettings:
        settings = self.db.query(StoreSettings).filter_by(tenant_id=tenant_id).first()
        if not settings:
            tenant = self.get_by_id(tenant_id)
            settings = StoreSettings(tenant_id=tenant_id, display_name=tenant.name)
            self.db.add(settings)

        for key, value in updates.items():
            if hasattr(settings, key) and value is not None:
                setattr(settings, key, value)

        self.db.commit()
        self.db.refresh(settings)
        return settings
