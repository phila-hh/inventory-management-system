# AI-Supported Inventory Management System

An AI-enabled, web-based inventory management system designed for small-to-medium, supply-based organizations. The system combines conventional inventory control mechanisms with AI-assisted reasoning to support forecasting, alerts, and natural language interaction.

This project was developed as a **Final Year Project (FYP)** for the **Department of Software Engineering, Mekelle University**.

---

## Live Deployment

* **Frontend (Web App):** [https://inventory-management-system-seven-sandy.vercel.app/](https://inventory-management-system-seven-sandy.vercel.app/)
* **Backend API (Swagger):** [https://stockflow-byv5.onrender.com/api](https://stockflow-byv5.onrender.com/api)

---

## Repository

[https://github.com/phila-hh/inventory-management-system](https://github.com/phila-hh/inventory-management-system)

---

## Overview

The system replaces spreadsheet-driven workflows and rigid legacy inventory tools with a modern, scalable architecture based on **NestJS**, **MongoDB**, and **React**. An external **LLM-powered reasoning layer** is integrated to assist decision-making rather than operate as an opaque prediction engine.

AI features are designed to be explainable, optional, and supported by deterministic fallbacks to ensure reliability in low-data scenarios.

---

## Key Capabilities

* Real-time inventory tracking and history
* Threshold-based and predictive stock alerts
* AI-assisted demand forecasting
* Natural language inventory queries via an AI assistant
* Secure, role-based access control

---

## Features

* **Inventory Management**
  CRUD operations for products and stock, real-time visibility, and historical usage tracking.

* **Hybrid Alerting System**
  Combines rule-based thresholds with AI-predicted alerts, executed through scheduled background jobs.

* **AI Forecasting Engine**
  Designed to work with sparse or incomplete historical data, with deterministic logic used as a fallback when AI confidence is low.

* **AI Assistant (RAG-based)**
  Context-aware chatbot that answers inventory-related questions using Retrieval-Augmented Generation.

* **Security**
  JWT-based authentication with role-based authorization.

---

## Architecture & Technology Stack

* **Frontend:** React
* **Backend:** NestJS (REST API)
* **Database:** MongoDB (Replica Set enabled for transactions)
* **AI Layer:** External LLM accessed via OpenRouter
* **Background Jobs:** Cron-based schedulers
* **Containerization:** Docker & Docker Compose
* **Deployment:** Vercel (Frontend), Render (Backend)

---

## Project Structure

```text
inventory-management-system/
├── backend/              # NestJS backend (see backend/QUICKSTART.md)
├── frontend/             # React frontend
├── mongo/                # MongoDB initialization configs
├── docker-compose.yml    # Full system orchestration
├── README.md
```

---

## Running the Project with Docker (Recommended)

The entire system can be run locally using Docker Compose.

### Prerequisites

* Docker
* Docker Compose

### Start the Application

```bash
docker compose up
```

This command starts:

* MongoDB (with replica set configuration)
* NestJS backend API
* React frontend

Once running, the frontend and backend will be accessible on their configured ports.

---

## Manual Setup (Without Docker)

### Backend

Backend setup instructions are provided in:

```text
backend/QUICKSTART.md
```

### Frontend

After the backend is running:

```bash
cd frontend
npm install
npm run dev
```

---

## Contributors

* **Daniel Kindeya**
  [https://github.com/Danielkindeya](https://github.com/Danielkindeya)

* **Sosna Gebremeskel**
  [https://github.com/sossygebremeskel](https://github.com/sossygebremeskel)

* **Filimon Haftom**
  [https://github.com/phila-hh](https://github.com/phila-hh)

---

## Academic Context

This project was developed strictly for academic purposes as a Final Year Project (FYP). The focus is on system design, software architecture, and the practical integration of AI-assisted decision support within an inventory management domain.

---

## License

Academic project developed as a Final Year Project (FYP).
All rights reserved unless stated otherwise.
