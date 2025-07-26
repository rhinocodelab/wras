from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
from app.core.database import get_db
from app.models.train_route import TrainRoute as TrainRouteModel
from app.schemas.train_route import TrainRoute, TrainRouteCreate, TrainRouteUpdate
from app.services.train_route_service import (
    create_train_route,
    get_train_route,
    get_train_routes,
    update_train_route,
    delete_train_route,
    search_train_routes
)

router = APIRouter()

@router.post("/", response_model=TrainRoute)
def create_route(train_route: TrainRouteCreate, db: Session = Depends(get_db)):
    """Create a new train route"""
    return create_train_route(db=db, train_route=train_route)

@router.get("/")
def read_routes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all train routes with pagination"""
    routes = get_train_routes(db, skip=skip, limit=limit)
    total = db.query(TrainRouteModel).count()
    return {
        "routes": routes,
        "total": total,
        "skip": skip,
        "limit": limit,
        "page": (skip // limit) + 1 if limit > 0 else 1,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.get("/{train_route_id}", response_model=TrainRoute)
def read_route(train_route_id: int, db: Session = Depends(get_db)):
    """Get a specific train route by ID"""
    route = get_train_route(db, train_route_id=train_route_id)
    if route is None:
        raise HTTPException(status_code=404, detail="Train route not found")
    return route

@router.put("/{train_route_id}", response_model=TrainRoute)
def update_route(train_route_id: int, train_route: TrainRouteUpdate, db: Session = Depends(get_db)):
    """Update a train route"""
    updated_route = update_train_route(db, train_route_id=train_route_id, train_route=train_route)
    if updated_route is None:
        raise HTTPException(status_code=404, detail="Train route not found")
    return updated_route

@router.delete("/{train_route_id}")
def delete_route(train_route_id: int, db: Session = Depends(get_db)):
    """Delete a train route"""
    success = delete_train_route(db, train_route_id=train_route_id)
    if not success:
        raise HTTPException(status_code=404, detail="Train route not found")
    return {"message": "Train route deleted successfully"}

@router.delete("/")
def clear_all_routes(db: Session = Depends(get_db)):
    """Clear all train routes from the database"""
    try:
        deleted_count = db.query(TrainRouteModel).delete()
        db.commit()
        return {
            "message": f"Successfully cleared {deleted_count} train routes from the database",
            "deleted_count": deleted_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error clearing routes: {str(e)}")

@router.get("/search/", response_model=List[TrainRoute])
def search_routes(query: str = Query(..., description="Search term"), db: Session = Depends(get_db)):
    """Search train routes by various fields"""
    routes = search_train_routes(db, query=query)
    return routes

@router.post("/import/")
async def import_routes(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import train routes from Excel or CSV file"""
    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.csv')):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx) or CSV (.csv) files are supported")
    
    try:
        # Read the file
        contents = await file.read()
        
        # Try to read as Excel first, then as CSV if that fails
        try:
            df = pd.read_excel(io.BytesIO(contents))
        except Exception:
            # If Excel reading fails, try as CSV
            try:
                df = pd.read_csv(io.BytesIO(contents))
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Could not read file as Excel or CSV: {str(e)}")
        
        # Map Excel column names to our database column names
        column_mapping = {
            'Train Number': 'train_number',
            'Train Name': 'train_name_en', 
            'Start Station': 'start_station_en',
            'Start Station Code': 'start_station_code',
            'End Station': 'end_station_en',
            'End Station Code': 'end_station_code'
        }
        
        # Check if we have the expected columns
        expected_columns = list(column_mapping.keys())
        missing_columns = [col for col in expected_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}. Expected columns: {', '.join(expected_columns)}"
            )
        
        # Process each row
        imported_count = 0
        for _, row in df.iterrows():
            try:
                route_data = {}
                for excel_col, db_col in column_mapping.items():
                    route_data[db_col] = str(row[excel_col]).strip()
                
                # Check if route already exists
                existing_route = db.query(TrainRouteModel).filter(
                    TrainRouteModel.train_number == route_data['train_number']
                ).first()
                
                if not existing_route:
                    train_route = TrainRouteCreate(**route_data)
                    create_train_route(db, train_route)
                    imported_count += 1
                
            except Exception as e:
                print(f"Error processing row: {e}")
                continue
        
        return {
            "message": f"Import completed successfully. {imported_count} routes imported.",
            "imported_count": imported_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}") 