from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
import asyncpg
import os
import json
from datetime import datetime
from app.middleware.auth import require_auth, get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])


# Request/Response Models
class TaskCreate(BaseModel):
    projectId: str = Field(..., description="Project ID")
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    orderIndex: int = Field(..., ge=0)
    agentType: Optional[str] = Field(None, max_length=50)
    assignedTo: Optional[str] = None
    dueDate: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    orderIndex: Optional[int] = Field(None, ge=0)
    agentType: Optional[str] = Field(None, max_length=50)
    assignedTo: Optional[str] = None
    status: Optional[str] = None
    dueDate: Optional[datetime] = None
    rubricScores: Optional[Any] = None


class TaskSubmission(BaseModel):
    submissionContent: str
    rubricScores: Optional[List[Dict[str, Any]]] = None


class TaskInfo(BaseModel):
    id: str
    projectId: str
    title: str
    description: Optional[str]
    orderIndex: int
    agentType: Optional[str]
    assignedTo: Optional[str]
    status: str
    dueDate: Optional[datetime]
    rubricScores: Optional[Any]
    submissionContent: Optional[str]
    submittedAt: Optional[datetime]
    createdAt: datetime
    updatedAt: datetime


class TaskResponse(BaseModel):
    task: TaskInfo


class TaskListResponse(BaseModel):
    tasks: List[TaskInfo]


async def get_db_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database configuration error"
        )
    conn = await asyncpg.connect(database_url)
    return conn


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    projectId: Optional[str] = None,
    assignedTo: Optional[str] = None,
    status_filter: Optional[str] = None,
    agentType: Optional[str] = None,
    payload: dict = Depends(require_auth)
):
    """List all tasks with optional filters"""
    conn = await get_db_connection()

    try:
        # Build query with optional filters
        query = """
            SELECT id, project_id, title, description, order_index, agent_type,
                   assigned_to, status, due_date, rubric_scores, submission_content,
                   submitted_at, created_at, updated_at
            FROM project_tasks
            WHERE TRUE
        """
        params = []
        param_count = 0

        if projectId:
            param_count += 1
            query += f" AND project_id = ${param_count}"
            params.append(projectId)

        if assignedTo:
            param_count += 1
            query += f" AND assigned_to = ${param_count}"
            params.append(assignedTo)

        if status_filter:
            param_count += 1
            query += f" AND status = ${param_count}"
            params.append(status_filter)

        if agentType:
            param_count += 1
            query += f" AND agent_type = ${param_count}"
            params.append(agentType)

        query += " ORDER BY order_index ASC, created_at DESC"

        rows = await conn.fetch(query, *params)

        tasks = [
            TaskInfo(
                id=row["id"],
                projectId=row["project_id"],
                title=row["title"],
                description=row["description"],
                orderIndex=row["order_index"],
                agentType=row["agent_type"],
                assignedTo=row["assigned_to"],
                status=row["status"],
                dueDate=row["due_date"],
                rubricScores=json.loads(row["rubric_scores"]) if row["rubric_scores"] else None,
                submissionContent=row["submission_content"],
                submittedAt=row["submitted_at"],
                createdAt=row["created_at"],
                updatedAt=row["updated_at"]
            )
            for row in rows
        ]

        return TaskListResponse(tasks=tasks)
    except asyncpg.PostgresError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        await conn.close()


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    payload: dict = Depends(require_auth)
):
    """Get a specific task by ID"""
    conn = await get_db_connection()

    try:
        row = await conn.fetchrow(
            """
            SELECT id, project_id, title, description, order_index, agent_type,
                   assigned_to, status, due_date, rubric_scores, submission_content,
                   submitted_at, created_at, updated_at
            FROM project_tasks
            WHERE id = $1
            """,
            task_id
        )

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        return TaskResponse(
            task=TaskInfo(
                id=row["id"],
                projectId=row["project_id"],
                title=row["title"],
                description=row["description"],
                orderIndex=row["order_index"],
                agentType=row["agent_type"],
                assignedTo=row["assigned_to"],
                status=row["status"],
                dueDate=row["due_date"],
                rubricScores=json.loads(row["rubric_scores"]) if row["rubric_scores"] else None,
                submissionContent=row["submission_content"],
                submittedAt=row["submitted_at"],
                createdAt=row["created_at"],
                updatedAt=row["updated_at"]
            )
        )
    except asyncpg.PostgresError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        await conn.close()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    payload: dict = Depends(require_auth)
):
    """Create a new task"""
    conn = await get_db_connection()

    try:
        # Verify project exists
        project = await conn.fetchrow(
            "SELECT id FROM projects WHERE id = $1",
            task_data.projectId
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        row = await conn.fetchrow(
            """
            INSERT INTO project_tasks (
                project_id, title, description, order_index, agent_type,
                assigned_to, due_date, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, project_id, title, description, order_index, agent_type,
                      assigned_to, status, due_date, rubric_scores, submission_content,
                      submitted_at, created_at, updated_at
            """,
            task_data.projectId,
            task_data.title,
            task_data.description,
            task_data.orderIndex,
            task_data.agentType,
            task_data.assignedTo,
            task_data.dueDate,
            "todo"
        )

        return TaskResponse(
            task=TaskInfo(
                id=row["id"],
                projectId=row["project_id"],
                title=row["title"],
                description=row["description"],
                orderIndex=row["order_index"],
                agentType=row["agent_type"],
                assignedTo=row["assigned_to"],
                status=row["status"],
                dueDate=row["due_date"],
                rubricScores=row["rubric_scores"],
                submissionContent=row["submission_content"],
                submittedAt=row["submitted_at"],
                createdAt=row["created_at"],
                updatedAt=row["updated_at"]
            )
        )
    except asyncpg.PostgresError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        await conn.close()


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    payload: dict = Depends(require_auth)
):
    """Update an existing task"""
    conn = await get_db_connection()

    try:
        # Check if task exists
        existing = await conn.fetchrow(
            "SELECT id FROM project_tasks WHERE id = $1",
            task_id
        )

        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        # Build update query dynamically
        update_fields = []
        update_values = []
        params = []
        param_count = 0

        for field, value in task_data.model_dump().items():
            if value is not None:
                param_count += 1
                db_field = {
                    "projectId": "project_id",
                    "orderIndex": "order_index",
                    "agentType": "agent_type",
                    "assignedTo": "assigned_to",
                    "dueDate": "due_date",
                    "rubricScores": "rubric_scores",
                    "submissionContent": "submission_content"
                }.get(field, field.lower())

                if db_field == "rubric_scores":
                    update_fields.append(f"{db_field} = ${param_count}")
                    params.append(json.dumps(value) if value else None)
                elif db_field == "due_date":
                    update_fields.append(f"{db_field} = ${param_count}")
                    params.append(value)
                else:
                    update_fields.append(f"{db_field} = ${param_count}")
                    params.append(value)

        param_count += 1
        params.append(task_id)

        query = f"""
            UPDATE project_tasks
            SET {", ".join(update_fields)}, updated_at = NOW()
            WHERE id = ${param_count}
            RETURNING id, project_id, title, description, order_index, agent_type,
                      assigned_to, status, due_date, rubric_scores, submission_content,
                      submitted_at, created_at, updated_at
        """

        row = await conn.fetchrow(query, *params)

        return TaskResponse(
            task=TaskInfo(
                id=row["id"],
                projectId=row["project_id"],
                title=row["title"],
                description=row["description"],
                orderIndex=row["order_index"],
                agentType=row["agent_type"],
                assignedTo=row["assigned_to"],
                status=row["status"],
                dueDate=row["due_date"],
                rubricScores=json.loads(row["rubric_scores"]) if row["rubric_scores"] else None,
                submissionContent=row["submission_content"],
                submittedAt=row["submitted_at"],
                createdAt=row["created_at"],
                updatedAt=row["updated_at"]
            )
        )
    except asyncpg.PostgresError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        await conn.close()


@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
async def delete_task(
    task_id: str,
    payload: dict = Depends(require_auth)
):
    """Delete a task"""
    conn = await get_db_connection()

    try:
        result = await conn.execute(
            "DELETE FROM project_tasks WHERE id = $1",
            task_id
        )

        if result == "DELETE 0":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        return {"message": "Task deleted successfully"}
    except asyncpg.PostgresError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        await conn.close()


@router.post("/{task_id}/submit", response_model=TaskResponse)
async def submit_task(
    task_id: str,
    submission: TaskSubmission,
    payload: dict = Depends(require_auth)
):
    """Submit a task with content and optional rubric scores"""
    conn = await get_db_connection()

    try:
        # Check if task exists
        existing = await conn.fetchrow(
            "SELECT id FROM project_tasks WHERE id = $1",
            task_id
        )

        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        row = await conn.fetchrow(
            """
            UPDATE project_tasks
            SET submission_content = $1,
                rubric_scores = $2,
                submitted_at = NOW(),
                status = 'review',
                updated_at = NOW()
            WHERE id = $3
            RETURNING id, project_id, title, description, order_index, agent_type,
                      assigned_to, status, due_date, rubric_scores, submission_content,
                      submitted_at, created_at, updated_at
            """,
            submission.submissionContent,
            json.dumps(submission.rubricScores) if submission.rubricScores else None,
            task_id
        )

        return TaskResponse(
            task=TaskInfo(
                id=row["id"],
                projectId=row["project_id"],
                title=row["title"],
                description=row["description"],
                orderIndex=row["order_index"],
                agentType=row["agent_type"],
                assignedTo=row["assigned_to"],
                status=row["status"],
                dueDate=row["due_date"],
                rubricScores=json.loads(row["rubric_scores"]) if row["rubric_scores"] else None,
                submissionContent=row["submission_content"],
                submittedAt=row["submitted_at"],
                createdAt=row["created_at"],
                updatedAt=row["updated_at"]
            )
        )
    except asyncpg.PostgresError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        await conn.close()
