from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from tradelens.baci_service import router as baci_router # further sorting of routers required
from tradelens.common_service import router as common_router
from tradelens.prodcom_service import router as prodcom_router
from tradelens.embedding import load_embeddings_data, setup_embeddings


def get_app():
    """Prepare the FastAPI app object"""
    app = FastAPI()

    embeddings_data = load_embeddings_data()
    embedding_model, embedding_matrices = setup_embeddings(embeddings_data)

    app.state.embeddings_data = embeddings_data
    app.state.embedding_model = embedding_model
    app.state.embedding_matrices = embedding_matrices

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
