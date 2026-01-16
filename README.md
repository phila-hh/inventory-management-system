# AI-Supported Inventory Management System

An AI-enabled, web-based inventory management system for small-to-medium supply-based organizations.
It combines traditional inventory control with AI-assisted reasoning for forecasting, alerts, and natural language interaction.

Developed as a **Final Year Project (FYP)** for the **Department of Software Engineering, Mekelle University**.

**Repository:**
[https://github.com/phila-hh/inventory-management-system](https://github.com/phila-hh/inventory-management-system)

---

## Overview

The system replaces spreadsheet-based and rigid legacy workflows with a modern **NestJS + MongoDB** backend and an external **LLM-powered reasoning layer**.
AI is used to assist decision-making rather than act as a black-box predictor.

**Core capabilities:**

* Real-time inventory tracking
* Predictive and threshold-based alerts
* AI-assisted demand forecasting
* Natural language inventory queries

---

## Features

* **Inventory Management:** CRUD operations, real-time stock visibility, usage history
* **Hybrid Alerts:** Threshold-based and AI-predicted alerts via scheduled background jobs
* **AI Forecasting:** Works with sparse data and includes deterministic fallbacks
* **AI Assistant:** Context-aware chatbot using Retrieval-Augmented Generation (RAG)
* **Security:** JWT authentication with role-based access control

---

## Architecture & Stack

* **Frontend:** React
* **Backend:** NestJS (REST API)
* **Database:** MongoDB
* **AI Layer:** External LLM via OpenRouter
* **Automation:** Cron jobs
* **Deployment:** Docker & Docker Compose

---

## Project Structure

```text
inventory-management-system/
├── backend/        # NestJS backend (see QUICKSTART.md)
├── frontend/       # React frontend
└── README.md
```

---

## Setup

Backend setup instructions are provided in:

```
backend/QUICKSTART.md
```

The frontend can be started after the backend is running.


```
cd frontend/
npm install
npm run dev
```

---

## Contributors

* **Daniel Kindeya** — [https://github.com/Danielkindeya](https://github.com/Danielkindeya)
* **Sosna Gebremeskel** — [https://github.com/sossygebremeskel](https://github.com/sossygebremeskel)
* **Filimon Haftom** — [https://github.com/phila-hh](https://github.com/phila-hh)

---

## License

Academic project developed as a Final Year Project (FYP).
All rights reserved unless stated otherwise.

---
