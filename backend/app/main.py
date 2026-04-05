from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.admin import router as admin_router
from app.api.v1.routes.drivers import router as drivers_router
from app.api.v1.routes.employees import router as employees_router
from app.api.v1.routes.pickup_requests import router as pickup_requests_router
from app.api.v1.routes.users import router as users_router
from app.api.v1.routes.vehicles import router as vehicles_router

app=FastAPI(title="Data-Driven Employee Routing System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(employees_router)
app.include_router(drivers_router)
app.include_router(vehicles_router)
app.include_router(pickup_requests_router)


@app.get("/")
def root():
    return {"message": "Welcome to Data-Driven Employee Routing System"}


@app.get("/health")
def health_check():
    return {"status": "ok"}