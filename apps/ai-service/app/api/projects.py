from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
import asyncpg
import os
import json
from datetime import datetime
from app.middleware.auth import require_auth, get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


# Request/Response Models
class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    gradeMin: Optional[int] = Field(None, ge=1, le=12)
    gradeMax: Optional[int] = Field(None, ge=1, le=12)
    subject: Optional[str] = Field(None, max_length=50)
    difficulty: Optional[int] = Field(1, ge=1, le=5)
    rubricCriteria: Optional[List[Dict[str, Any]]] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    gradeMin: Optional[int] = Field(None, ge=1, le=12)
    gradeMax: Optional[int] = Field(None, ge=1, le=12)
    subject: Optional[str] = Field(None, max_length=50)
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    status: Optional[str] = None
    rubricCriteria: Optional[List[Dict[str, Any]]] = None


class ProjectInfo(BaseModel):
    id: str
    title: str
    description: Optional[str]
    gradeMin: Optional[int]
    gradeMax: Optional[int]
    subject: Optional[str]
    difficulty: int
    status: str
    rubricCriteria: Optional[Any]
    createdAt: datetime
    updatedAt: datetime


class ProjectResponse(BaseModel):
    project: ProjectInfo


class ProjectListResponse(BaseModel):
    projects: List[ProjectInfo]


async def get_db_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database configuration error"
        )
    conn = await asyncpg.connect(database_url)
    return conn


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    status_filter: Optional[str] = None,
    subject: Optional[str] = None,
    limit: int = 50,
    payload: dict = Depends(require_auth)
):
    """List all projects with optional filters"""
    conn = await get_db_connection()

    try:
        # Build query with optional filters
        query = """
            SELECT id, title, description, grade_min, grade_max, subject,
                   difficulty, status, rubric_criteria, created_at, updated_at
            FROM projects
            WHERE TRUE
        """
        params = []
        param_count = 0

        if status_filter:
            param_count += 1
            query += f" AND status = ${param_count}"
            params.append(status_filter)

        if subject:
            param_count += 1
            query += f" AND subject = ${param_count}"
            params.append(subject)

        query += f" ORDER BY created_at DESC LIMIT ${param_count + 1}"
        params.append(limit)

        rows = await conn.fetch(query, *params)

        projects = [
            ProjectInfo(
                id=row["id"],
                title=row["title"],
                description=row["description"],
                gradeMin=row["grade_min"],
                gradeMax=row["grade_max"],
                subject=row["subject"],
                difficulty=row["difficulty"],
                status=row["status"],
                rubricCriteria=json.loads(row["rubric_criteria"]) if row["rubric_criteria"] else None,
                createdAt=row["created_at"],
                updatedAt=row["updated_at"]
            )
            for row in rows
        ]

        return ProjectListResponse(projects=projects)
    except asyncpg.PostgresError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        await conn.close()


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    payload: dict = Depends(require_auth)
):
    """Get a specific project by ID"""
    conn = await get_db_connection()

    try:
        row = await conn.fetchrow(
            """
            SELECT id, title, description, grade_min, grade_max, subject,
                   difficulty, status, rubric_criteria, created_at, updated_at
            FROM projects
            WHERE id = $1
            """,
            project_id
        )

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        return ProjectResponse(
            project=ProjectInfo(
                id=row["id"],
                title=row["title"],
                description=row["description"],
                gradeMin=row["grade_min"],
                gradeMax=row["grade_max"],
                subject=row["subject"],
                difficulty=row["difficulty"],
                status=row["status"],
                rubricCriteria=json.loads(row["rubric_criteria"]) if row["rubric_criteria"] else None,
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


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    payload: dict = Depends(require_auth)
):
    """Create a new project"""
    conn = await get_db_connection()

    try:
        row = await conn.fetchrow(
            """
            INSERT INTO projects (
                title, description, grade_min, grade_max, subject,
                difficulty, status, rubric_criteria
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, title, description, grade_min, grade_max, subject,
                      difficulty, status, rubric_criteria, created_at, updated_at
            """,
            project_data.title,
            project_data.description,
            project_data.gradeMin,
            project_data.gradeMax,
            project_data.subject,
            project_data.difficulty,
            "draft",
            json.dumps(project_data.rubricCriteria) if project_data.rubricCriteria else None
        )

        return ProjectResponse(
            project=ProjectInfo(
                id=row["id"],
                title=row["title"],
                description=row["description"],
                gradeMin=row["grade_min"],
                gradeMax=row["grade_max"],
                subject=row["subject"],
                difficulty=row["difficulty"],
                status=row["status"],
                rubricCriteria=json.loads(row["rubric_criteria"]) if row["rubric_criteria"] else None,
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


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    payload: dict = Depends(require_auth)
):
    """Update an existing project"""
    conn = await get_db_connection()

    try:
        # Check if project exists
        existing = await conn.fetchrow(
            "SELECT id FROM projects WHERE id = $1",
            project_id
        )

        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        # Build update query dynamically
        update_fields = []
        update_values = []
        params = []
        param_count = 0

        for field, value in project_data.model_dump().items():
            if value is not None:
                param_count += 1
                db_field = {
                    "gradeMin": "grade_min",
                    "gradeMax": "grade_max",
                    "rubricCriteria": "rubric_criteria"
                }.get(field, field.lower())

                if db_field == "rubric_criteria":
                    update_fields.append(f"{db_field} = ${param_count}")
                    params.append(json.dumps(value) if value else None)
                else:
                    update_fields.append(f"{db_field} = ${param_count}")
                    params.append(value)

        param_count += 1
        params.append(project_id)

        query = f"""
            UPDATE projects
            SET {", ".join(update_fields)}, updated_at = NOW()
            WHERE id = ${param_count}
            RETURNING id, title, description, grade_min, grade_max, subject,
                      difficulty, status, rubric_criteria, created_at, updated_at
        """

        row = await conn.fetchrow(query, *params)

        return ProjectResponse(
            project=ProjectInfo(
                id=row["id"],
                title=row["title"],
                description=row["description"],
                gradeMin=row["grade_min"],
                gradeMax=row["grade_max"],
                subject=row["subject"],
                difficulty=row["difficulty"],
                status=row["status"],
                rubricCriteria=json.loads(row["rubric_criteria"]) if row["rubric_criteria"] else None,
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


@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
async def delete_project(
    project_id: str,
    payload: dict = Depends(require_auth)
):
    """Delete a project"""
    conn = await get_db_connection()

    try:
        result = await conn.execute(
            "DELETE FROM projects WHERE id = $1",
            project_id
        )

        if result == "DELETE 0":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        return {"message": "Project deleted successfully"}
    except asyncpg.PostgresError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        await conn.close()
