# 1. Create Python virtual environment

```bash
python3 -m venv trade_api_venv
```

# 2. Activate virtual environment

**On mac:**
```bash
source trade_api_venv/bin/activate`
```

**On windows:**
```bash
.\trade_api_venv\Scripts\activate
```

# 3. Install python dependencies (includes requests library needed for data download)

**On mac:**
```bash
pip install -r api/requirements_macos.txt
```

**On windows:**

Navigate to `\api` with 
```bash
cd api
```

and then run install the pyproject.toml requirements with:
```bash
pip  install  -e .
```

# 4. Download data files from S3 (~1GB+)
TradeLens relies on some data files too big for GitHub to track conveniently.

From the root of the `\TradeLens` folder, run `data-setup.py` to download the neccesary files:
```bash
python data-setup.py
```
This creates: api/data/BACI/, api/data/prodcom/, api/data/shared/

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

Verify the installation with:
```bash
node --version  
```
which should output the current version of node installed.

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