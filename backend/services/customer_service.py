# backend/services/customer_service.py
"""Tenant-scoped Customer CRM service."""
import uuid
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from backend.models.customer import Customer
from backend.models.order import Order
from backend.schemas.customer import CustomerCreateDTO, CustomerFilterParams
from backend.core.errors import EntityNotFoundException, ValidationException


class CustomerService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, tenant_id: str, customer_id: str) -> Customer:
        cust = self.db.query(Customer).filter_by(tenant_id=tenant_id, id=customer_id).first()
        if not cust:
            raise EntityNotFoundException("Customer", customer_id)
        return cust

    def list_customers(
        self,
        tenant_id: str,
        filters: Optional[CustomerFilterParams] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[Customer], int]:
        q = self.db.query(Customer).filter(Customer.tenant_id == tenant_id)

        if filters:
            if filters.rfm_segment:
                q = q.filter(Customer.rfm_segment == filters.rfm_segment)
            if filters.city:
                q = q.filter(Customer.city == filters.city)
            if filters.min_spent is not None:
                q = q.filter(Customer.total_spent >= filters.min_spent)
            if filters.search:
                term = f"%{filters.search}%"
                q = q.filter(
                    (Customer.name.ilike(term)) |
                    (Customer.email.ilike(term)) |
                    (Customer.phone.ilike(term))
                )

        total = q.count()
        offset = (page - 1) * page_size
        customers = q.order_by(Customer.total_spent.desc()).offset(offset).limit(page_size).all()
        return customers, total

    def create_customer(self, tenant_id: str, dto: CustomerCreateDTO) -> Customer:
        if dto.phone:
            existing = self.db.query(Customer).filter_by(tenant_id=tenant_id, phone=dto.phone).first()
            if existing:
                raise ValidationException(f"Customer with phone '{dto.phone}' already exists.")

        cust = Customer(
            id=f"cust_{uuid.uuid4().hex[:10]}",
            tenant_id=tenant_id,
            name=dto.name,
            phone=dto.phone,
            email=str(dto.email) if dto.email else None,
            governorate=dto.governorate,
            city=dto.city,
            address=dto.address,
        )
        self.db.add(cust)
        self.db.commit()
        self.db.refresh(cust)
        return cust

    def get_customer_orders(self, tenant_id: str, customer_id: str) -> List[Order]:
        cust = self.get_by_id(tenant_id, customer_id)
        if not cust.phone:
            return []
        # Filter safely across all DB engines without engine-specific JSON operator assumptions
        orders = (
            self.db.query(Order)
            .filter(Order.tenant_id == tenant_id)
            .order_by(Order.created_at.desc())
            .all()
        )
        matched = [o for o in orders if (o.shipping_address or {}).get("phone") == cust.phone]
        return matched
