from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from tradelens.baci_service import router as baci_router # further sorting of routers required
from tradelens.common_service import router as common_router
from tradelens.prodcom_service import router as prodcom_router


def get_app():
    """Prepare the FastAPI app object"""
    app = FastAPI()

    app.include_router(baci_router)
    app.include_router(common_router)
    app.include_router(prodcom_router)

    # Add Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app