from fastapi import FastAPI
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.users import router as users_router

app=FastAPI(title="Data-Driven Employee Routing System")

app.include_router(auth_router)
app.include_router(users_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}