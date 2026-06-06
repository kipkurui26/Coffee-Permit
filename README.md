# Coffee Movement Permit System

A full-stack web application for managing and tracking coffee movement permits across the supply chain — from farmers and societies to warehouses and transport.

**Stack:** Django · Django Channels · PostgreSQL · Redis · React · Vite · TailwindCSS

---

## Repository Structure

```
Coffee-Permit/
├── server-cmp/   # Django backend (REST API + WebSockets)
└── client-cmp/   # React + Vite frontend
```

---

## Getting Started

Clone the repository:

**Using SSH**
```bash
git clone git@github.com:kipkurui26/Coffee-Permit.git
cd Coffee-Permit
```

**Using HTTPS**
```bash
git clone https://github.com/kipkurui26/Coffee-Permit.git
cd Coffee-Permit
```

Then set up each part in order — the frontend depends on the backend being running:

1. [Backend Setup](./server-cmp/README.md)
2. [Frontend Setup](./client-cmp/README.md)

---

