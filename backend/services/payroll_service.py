import uuid
from typing import Any
from fastapi import HTTPException, status
from pymongo import DESCENDING
from backend.database import get_db
from backend.models.base import serialize_doc
from backend.utils.helpers import log_audit, now_iso
from backend.utils.permissions import verify_employee_access
from backend.schemas.payroll import PayrollCreate, PayrollUpdate


class PayrollService:
    @staticmethod
    def create_or_calculate_payroll(current_user: dict, payload: PayrollCreate) -> dict:
        db = get_db()
        emp = db["employees"].find_one({"employee_id": payload.employee_id})
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        # Overtime rate default: 1.5x hourly rate (assuming 160 hrs/month)
        hourly_rate = payload.basic_salary / 160.0 if payload.basic_salary > 0 else 0
        ot_rate = payload.overtime_rate if payload.overtime_rate is not None else round(hourly_rate * 1.5, 2)
        ot_amount = round(payload.overtime_hours * ot_rate, 2)

        gross = round(payload.basic_salary + payload.allowances + ot_amount, 2)
        net = round(gross - payload.deductions, 2)

        existing = db["payroll"].find_one({
            "employee_id": payload.employee_id,
            "pay_period": payload.pay_period,
        })

        now_str = now_iso()
        doc = {
            "employee_id": payload.employee_id,
            "pay_period": payload.pay_period,
            "basic_salary": payload.basic_salary,
            "allowances": payload.allowances,
            "deductions": payload.deductions,
            "overtime_hours": payload.overtime_hours,
            "overtime_amount": ot_amount,
            "gross_salary": gross,
            "net_salary": net,
            "status": "Calculated",
            "processed_at": now_str,
        }

        if existing:
            db["payroll"].update_one({"_id": existing["_id"]}, {"$set": doc})
            payroll_id = existing.get("payroll_id", f"PAY-{uuid.uuid4().hex[:8].upper()}")
        else:
            payroll_id = f"PAY-{uuid.uuid4().hex[:8].upper()}"
            doc["payroll_id"] = payroll_id
            db["payroll"].insert_one(doc)

        log_audit(
            user_id=current_user["user_id"],
            action="PAYROLL_RECORD_SAVED",
            entity_type="PAYROLL",
            entity_id=payroll_id,
            metadata={"employee_id": payload.employee_id, "period": payload.pay_period, "net_salary": net},
        )

        record = db["payroll"].find_one({"employee_id": payload.employee_id, "pay_period": payload.pay_period})
        res = serialize_doc(record)
        res["employee_name"] = emp["full_name"]
        res["department"] = emp["department"]
        return res

    @staticmethod
    def get_my_payroll(current_user: dict, pay_period: str | None = None) -> list[dict]:
        db = get_db()
        emp_id = current_user.get("employee_id")
        emp = db["employees"].find_one({"employee_id": emp_id})

        query: dict[str, Any] = {"employee_id": emp_id}
        if pay_period:
            query["pay_period"] = pay_period

        cursor = db["payroll"].find(query).sort("pay_period", DESCENDING)
        records = []
        for doc in cursor:
            d = serialize_doc(doc)
            d["employee_name"] = emp.get("full_name") if emp else None
            d["department"] = emp.get("department") if emp else None
            records.append(d)
        return records

    @staticmethod
    def get_payroll_list(
        current_user: dict,
        pay_period: str | None = None,
        department: str | None = None,
        employee_id: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        db = get_db()
        query: dict[str, Any] = {}

        if pay_period:
            query["pay_period"] = pay_period
        if employee_id:
            query["employee_id"] = employee_id

        if department:
            dept_emp_ids = [
                d["employee_id"]
                for d in db["employees"].find({"department": department}, {"employee_id": 1})
            ]
            query["employee_id"] = {"$in": dept_emp_ids}

        total = db["payroll"].count_documents(query)
        skip = (page - 1) * page_size
        cursor = db["payroll"].find(query).sort("pay_period", DESCENDING).skip(skip).limit(page_size)

        emp_map = {
            e["employee_id"]: (e["full_name"], e["department"])
            for e in db["employees"].find({}, {"employee_id": 1, "full_name": 1, "department": 1})
        }

        items = []
        for doc in cursor:
            d = serialize_doc(doc)
            emp_info = emp_map.get(d["employee_id"], (None, None))
            d["employee_name"] = emp_info[0]
            d["department"] = emp_info[1]
            items.append(d)

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
