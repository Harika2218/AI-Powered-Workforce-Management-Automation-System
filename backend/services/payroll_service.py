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

        period = payload.pay_period or payload.month or now_iso()[:7]
        basic_salary = (
            payload.basic_salary
            if (payload.basic_salary is not None and payload.basic_salary > 0)
            else float(emp.get("salary") or 75000.0)
        )
        allowances = payload.allowances if payload.allowances > 0 else float(emp.get("allowances") or 1000.0)

        # Derive actual overtime hours from attendance records for this period if not explicitly given
        if payload.overtime_hours > 0:
            ot_hours = payload.overtime_hours
        else:
            att_records = list(db["attendance"].find({
                "employee_id": payload.employee_id,
                "date": {"$regex": f"^{period}"},
            }))
            ot_hours = round(sum(r.get("overtime_hours", 0.0) for r in att_records), 1)

        hourly_rate = basic_salary / 160.0 if basic_salary > 0 else 0
        ot_rate = payload.overtime_rate if payload.overtime_rate is not None else round(hourly_rate * 1.5, 2)
        ot_amount = round(ot_hours * ot_rate, 2)

        gross = round(basic_salary + allowances + ot_amount, 2)
        deductions = payload.deductions if payload.deductions > 0 else round(gross * 0.15, 2)  # Standard 15% taxes/benefits if 0
        net = round(gross - deductions, 2)

        existing = db["payroll"].find_one({
            "employee_id": payload.employee_id,
            "pay_period": period,
        })

        now_str = now_iso()
        doc = {
            "employee_id": payload.employee_id,
            "pay_period": period,
            "basic_salary": basic_salary,
            "allowances": allowances,
            "deductions": deductions,
            "overtime_hours": ot_hours,
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

        record = db["payroll"].find_one({"employee_id": payload.employee_id, "pay_period": period})
        res = serialize_doc(record)
        res["employee_name"] = emp["full_name"]
        res["department"] = emp["department"]
        res["month"] = res.get("pay_period")
        res["overtime_pay"] = res.get("overtime_amount", 0.0)
        res["payment_status"] = "PAID" if res.get("status") == "Finalized" else "PROCESSED"
        return res

    @staticmethod
    def _enrich_payroll_doc(d: dict, emp_name: str | None, dept: str | None) -> dict:
        d["employee_name"] = emp_name
        d["department"] = dept
        d["month"] = d.get("pay_period")
        d["overtime_pay"] = d.get("overtime_amount", 0.0)
        st = d.get("status")
        d["payment_status"] = "PAID" if st == "Finalized" else ("PROCESSED" if st == "Calculated" else "PENDING")
        return d

    @staticmethod
    def get_employee_statement(employee_id: str, year: int | None = None, month: int | None = None) -> list[dict]:
        db = get_db()
        emp = db["employees"].find_one({"employee_id": employee_id})
        query: dict[str, Any] = {"employee_id": employee_id}
        if year and month:
            query["pay_period"] = f"{year:04d}-{month:02d}"
        elif year:
            query["pay_period"] = {"$regex": f"^{year:04d}"}

        cursor = db["payroll"].find(query).sort("pay_period", DESCENDING)
        records = []
        for doc in cursor:
            d = serialize_doc(doc)
            emp_name = emp.get("full_name") if emp else None
            dept = emp.get("department") if emp else None
            records.append(PayrollService._enrich_payroll_doc(d, emp_name, dept))
        return records

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
            emp_name = emp.get("full_name") if emp else None
            dept = emp.get("department") if emp else None
            records.append(PayrollService._enrich_payroll_doc(d, emp_name, dept))
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
            items.append(PayrollService._enrich_payroll_doc(d, emp_info[0], emp_info[1]))

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    @staticmethod
    def get_payroll_summary() -> dict:
        db = get_db()
        records = list(db["payroll"].find())
        total_payout = round(sum(r.get("net_salary", 0.0) for r in records), 2)
        total_gross = round(sum(r.get("gross_salary", 0.0) for r in records), 2)
        total_tax_deductions = round(sum(r.get("deductions", 0.0) for r in records), 2)
        total_overtime = round(sum(r.get("overtime_amount", 0.0) for r in records), 2)
        paid_count = sum(1 for r in records if (r.get("status") or "").upper() == "PAID")
        pending_count = sum(1 for r in records if (r.get("status") or "").upper() == "PENDING")
        return {
            "total_records": len(records),
            "total_net_payout": total_payout,
            "total_gross": total_gross,
            "total_deductions": total_tax_deductions,
            "total_overtime_paid": total_overtime,
            "paid_count": paid_count,
            "pending_count": pending_count,
        }
