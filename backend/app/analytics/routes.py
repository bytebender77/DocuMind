"""
Analytics routes for message statistics and insights.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast
from sqlalchemy.types import Date
from uuid import UUID
from datetime import datetime, date, timedelta
from typing import List
from app.db.database import get_db
from app.db.models import Workspace, MessageLog
from app.db.schemas import AnalyticsSummaryResponse, MessagesPerDayResponse, DailyMessageCount
from app.dependencies.workspace import verify_workspace_ownership

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary/{workspace_id}", response_model=AnalyticsSummaryResponse, status_code=status.HTTP_200_OK)
async def get_analytics_summary(
    workspace_id: UUID,
    workspace: Workspace = Depends(verify_workspace_ownership),
    db: Session = Depends(get_db)
):
    """
    Get analytics summary for a workspace.
    
    Returns:
        - Total messages count
        - Messages today count
        - Context success rate (percentage of messages that used context)
        - Top 10 most asked questions
    
    Args:
        workspace_id: UUID of the workspace
        workspace: Workspace object (verified ownership via dependency)
        db: Database session
        
    Returns:
        AnalyticsSummaryResponse with statistics
    """
    # Total messages count
    total_messages = db.query(func.count(MessageLog.id)).filter(
        MessageLog.workspace_id == workspace_id
    ).scalar() or 0
    
    # Messages today count
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    messages_today = db.query(func.count(MessageLog.id)).filter(
        MessageLog.workspace_id == workspace_id,
        MessageLog.created_at >= today_start
    ).scalar() or 0
    
    # Context success rate
    total_with_context = db.query(func.count(MessageLog.id)).filter(
        MessageLog.workspace_id == workspace_id,
        MessageLog.is_context_used == True
    ).scalar() or 0
    
    context_success_rate = 0.0
    if total_messages > 0:
        context_success_rate = round((total_with_context / total_messages) * 100, 2)
    
    # Top 10 questions (most frequent)
    top_questions_query = db.query(
        MessageLog.question,
        func.count(MessageLog.id).label('count')
    ).filter(
        MessageLog.workspace_id == workspace_id
    ).group_by(
        MessageLog.question
    ).order_by(
        desc('count')
    ).limit(10).all()
    
    top_questions = [q[0] for q in top_questions_query]
    
    return AnalyticsSummaryResponse(
        total_messages=total_messages,
        messages_today=messages_today,
        context_success_rate=context_success_rate,
        top_questions=top_questions
    )


@router.get("/messages-per-day/{workspace_id}", response_model=MessagesPerDayResponse, status_code=status.HTTP_200_OK)
async def get_messages_per_day(
    workspace_id: UUID,
    days: int = 30,  # Default to last 30 days
    workspace: Workspace = Depends(verify_workspace_ownership),
    db: Session = Depends(get_db)
):
    """
    Get message counts per day for a workspace (for chart visualization).
    
    Args:
        workspace_id: UUID of the workspace
        days: Number of days to retrieve (default: 30, max: 365)
        workspace: Workspace object (verified ownership via dependency)
        db: Database session
        
    Returns:
        MessagesPerDayResponse with daily counts
    """
    # Limit days to reasonable range
    if days > 365:
        days = 365
    if days < 1:
        days = 30
    
    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    
    # Query message counts grouped by date
    daily_counts = db.query(
        cast(MessageLog.created_at, Date).label('date'),
        func.count(MessageLog.id).label('count')
    ).filter(
        MessageLog.workspace_id == workspace_id,
        cast(MessageLog.created_at, Date) >= start_date,
        cast(MessageLog.created_at, Date) <= end_date
    ).group_by(
        cast(MessageLog.created_at, Date)
    ).order_by(
        cast(MessageLog.created_at, Date)
    ).all()
    
    # Create a dictionary for easy lookup
    counts_dict = {str(row.date): row.count for row in daily_counts}
    
    # Fill in missing dates with 0
    data = []
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.isoformat()
        count = counts_dict.get(date_str, 0)
        data.append(DailyMessageCount(date=date_str, count=count))
        current_date += timedelta(days=1)
    
    return MessagesPerDayResponse(data=data)

