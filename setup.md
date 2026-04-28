# 1. Create Python virtual environment

```bash
python3 -m venv trade_api_venv
```

# 2. Activate virtual environment

```bash
source trade_api_venv/bin/activate`
```

# 3. Install python dependencies (includes requests library needed for data download)

```bash
pip install -r api/requirements_macos.txt
```

# 4. Download data files from S3 (~1GB+)
Creates: api/data/BACI/, api/data/prodcom/, api/data/shared/

```bash
python data-setup.py
```

# Launch FastAPI server (defaults to http://localhost:8000)

In activated venv, from root directory
```bash
cd api
```

Run the backend:
```bash
uvicorn main:app --reload
```

# Launching front end
## Prerequisites: Node.js 18.18+ (download from nodejs.org if needed)

```bash
node --version  # verify installation
```

## Install dependencies

```bash
cd app
npm install 
```
If package issues are flagged, resolve dependency conflicts with

```bash
npm install --legacy-peer-deps   # 
```

Fix any remaining vulnerabilities with
```bash
npm audit fix  
```

## Start dev server (http://localhost:5173)

```bash
npm run dev
```