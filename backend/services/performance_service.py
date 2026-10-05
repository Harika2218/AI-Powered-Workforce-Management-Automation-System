import uuid
from typing import Any
from fastapi import HTTPException, status
from pymongo import DESCENDING
from backend.database import get_db
from backend.models.base import serialize_doc
from backend.utils.helpers import log_audit, create_notification, now_iso
from backend.utils.permissions import get_manager_team_ids, verify_employee_access
from backend.schemas.performance import PerformanceCreate, PerformanceUpdate, PerformanceAnalytics


class PerformanceService:
    @staticmethod
    def create_review(current_user: dict, payload: PerformanceCreate) -> dict:
        db = get_db()
        emp = db["employees"].find_one({"employee_id": payload.employee_id})
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")
        if role == "MANAGER" and emp.get("manager_id") != user_emp_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Managers can only create reviews for their direct team")

        review_id = f"PERF-{uuid.uuid4().hex[:8].upper()}"
        doc = payload.model_dump()
        doc["review_id"] = review_id
        doc["reviewer_id"] = user_emp_id or current_user["user_id"]
        doc["updated_at"] = now_iso()

        db["performance"].insert_one(doc)

        log_audit(
            user_id=current_user["user_id"],
            action="PERFORMANCE_REVIEW_CREATED",
            entity_type="PERFORMANCE",
            entity_id=review_id,
            metadata={"employee_id": payload.employee_id, "score": payload.overall_score, "period": payload.review_period},
        )

        target_user = db["users"].find_one({"employee_id": payload.employee_id})
        if target_user:
            create_notification(
                user_id=target_user["user_id"],
                title="Performance Review Completed",
                message=f"Your performance review for {payload.review_period} has been posted with score {payload.overall_score}.",
                type="performance",
            )

        res = serialize_doc(db["performance"].find_one({"review_id": review_id}))
        res["employee_name"] = emp["full_name"]
        res["department"] = emp["department"]
        return res

    @staticmethod
    def update_review(current_user: dict, review_id: str, payload: PerformanceUpdate) -> dict:
        db = get_db()
        review = db["performance"].find_one({"review_id": review_id})
        if not review:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Performance review not found")

        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")
        emp = db["employees"].find_one({"employee_id": review["employee_id"]})
        if role == "MANAGER" and emp and emp.get("manager_id") != user_emp_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit review outside your team")

        updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        if updates:
            updates["updated_at"] = now_iso()
            db["performance"].update_one({"review_id": review_id}, {"$set": updates})

        log_audit(
            user_id=current_user["user_id"],
            action="PERFORMANCE_REVIEW_UPDATED",
            entity_type="PERFORMANCE",
            entity_id=review_id,
            metadata=updates,
        )

        res = serialize_doc(db["performance"].find_one({"review_id": review_id}))
        if emp:
            res["employee_name"] = emp["full_name"]
            res["department"] = emp["department"]
        return res

    @staticmethod
    def get_my_reviews(current_user: dict) -> list[dict]:
        db = get_db()
    @staticmethod
    def _enrich_review(d: dict, emp_name: str | None, dept: str | None) -> dict:
        d["employee_name"] = emp_name
        d["department"] = dept
        d["period"] = d.get("review_period") or d.get("period") or "2026-Q3"
        d["review_period"] = d["period"]
        d["comments"] = d.get("manager_comments") or d.get("comments") or ""
        d["manager_comments"] = d["comments"]
        if not d.get("goals_rating"):
            d["goals_rating"] = round(min(5.0, d.get("overall_score", 4.0) * 0.95), 1)
        if isinstance(d.get("strengths"), list):
            d["strengths"] = ", ".join(d["strengths"])
        if isinstance(d.get("areas_for_improvement"), list):
            d["areas_for_improvement"] = ", ".join(d["areas_for_improvement"])
        if isinstance(d.get("goals"), list):
            d["goals"] = ", ".join(d["goals"])
        return d

    @staticmethod
    def get_my_reviews(current_user: dict) -> list[dict]:
        db = get_db()
        emp_id = current_user.get("employee_id")
        emp = db["employees"].find_one({"employee_id": emp_id})

        cursor = db["performance"].find({"employee_id": emp_id}).sort("updated_at", DESCENDING)
        records = []
        for doc in cursor:
            d = serialize_doc(doc)
            records.append(PerformanceService._enrich_review(d, emp.get("full_name") if emp else None, emp.get("department") if emp else None))
        return records

    @staticmethod
    def get_team_reviews(current_user: dict) -> list[dict]:
        db = get_db()
        user_emp_id = current_user.get("employee_id")
        team_ids = get_manager_team_ids(user_emp_id)

        emp_map = {
            e["employee_id"]: (e["full_name"], e["department"])
            for e in db["employees"].find({"employee_id": {"$in": team_ids}}, {"employee_id": 1, "full_name": 1, "department": 1})
        }

        cursor = db["performance"].find({"employee_id": {"$in": team_ids}}).sort("updated_at", DESCENDING)
        records = []
        for doc in cursor:
            d = serialize_doc(doc)
            info = emp_map.get(d["employee_id"], (None, None))
            records.append(PerformanceService._enrich_review(d, info[0], info[1]))
        return records

    @staticmethod
    def get_all_reviews(
        current_user: dict,
        department: str | None = None,
        review_period: str | None = None,
        period: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        db = get_db()
        query: dict[str, Any] = {}
        eff_period = review_period or period
        if eff_period:
            query["$or"] = [{"review_period": eff_period}, {"period": eff_period}]

        if status:
            query["status"] = status

        if department:
            dept_emp_ids = [d["employee_id"] for d in db["employees"].find({"department": department}, {"employee_id": 1})]
            query["employee_id"] = {"$in": dept_emp_ids}

        total = db["performance"].count_documents(query)
        skip = (page - 1) * page_size
        cursor = db["performance"].find(query).sort("updated_at", DESCENDING).skip(skip).limit(page_size)

        emp_map = {
            e["employee_id"]: (e["full_name"], e["department"])
            for e in db["employees"].find({}, {"employee_id": 1, "full_name": 1, "department": 1})
        }

        items = []
        for doc in cursor:
            d = serialize_doc(doc)
            info = emp_map.get(d["employee_id"], (None, None))
            items.append(PerformanceService._enrich_review(d, info[0], info[1]))

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    @staticmethod
    def get_analytics() -> PerformanceAnalytics:
        db = get_db()
        pipeline = [
            {"$match": {"status": "Completed"}},
            {
                "$group": {
                    "_id": None,
                    "avg_score": {"$avg": "$overall_score"},
                    "total": {"$sum": 1},
                }
            }
        ]
        res = list(db["performance"].aggregate(pipeline))
        avg_score = round(res[0]["avg_score"], 2) if res else 0.0
        total_rev = res[0]["total"] if res else 0

        # Department performance breakdown
        dept_pipeline = [
            {"$match": {"status": "Completed"}},
            {
                "$lookup": {
                    "from": "employees",
                    "localField": "employee_id",
                    "foreignField": "employee_id",
                    "as": "emp",
                }
            },
            {"$unwind": "$emp"},
            {
                "$group": {
                    "_id": "$emp.department",
                    "avg_score": {"$avg": "$overall_score"},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"avg_score": -1}},
        ]
        dept_res = list(db["performance"].aggregate(dept_pipeline))
        department_averages = [
            {"department": d["_id"], "avg_score": round(d["avg_score"], 2), "count": d["count"]}
            for d in dept_res
        ]

        # Score distribution buckets: 1.0-2.0, 2.0-3.0, 3.0-4.0, 4.0-5.0
        scores = [d["overall_score"] for d in db["performance"].find({"status": "Completed"}, {"overall_score": 1})]
        dist = {"1.0-2.0": 0, "2.0-3.0": 0, "3.0-4.0": 0, "4.0-5.0": 0}
        for s in scores:
            if s < 2.0:
                dist["1.0-2.0"] += 1
            elif s < 3.0:
                dist["2.0-3.0"] += 1
            elif s < 4.0:
                dist["3.0-4.0"] += 1
            else:
                dist["4.0-5.0"] += 1

        return PerformanceAnalytics(
            average_score=avg_score,
            total_reviews=total_rev,
            department_averages=department_averages,
            score_distribution=dist,
        )
