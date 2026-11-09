# Architecture

React dashboard -> Express API (auth, apps, permissions, events) -> MongoDB.
Express calls the FastAPI detection engine after each batch of events; the engine is stateless and
returns explainable results (reason, severity, penalty). Express persists score and alerts.
Boundaries: backend validates/stores; engine analyses; frontend displays and lets the user manage simulated permissions.
